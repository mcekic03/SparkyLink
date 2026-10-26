<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class File implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes)
    {
        if (! $value) {
            return null;
        }

        $data = json_decode($value, true);

        /**
         * Since get method is called even when storing models, due to calling attributes when creating Eloquent model we
         * need to ensure it does not set absolute path/url before saving because when that field is retrieved from DB
         * it will get additional path/url prefixes from getter making it double and non-existent.
         * E.g. If we save `uploads/image.jpg`, this method will be called before persisting into DB making
         * field in SQL query like this: `/var/www/larastarter/storage/app/public/uploads/image.jpg`
         * - this is absolute path to the project storage in Linux environment,
         * in Windows it can be something like `C:wamp/www/larastarter/storage/app/public/uploads/image.jpg`.
         * When field is saved like this and then we try to access it(retrieve it from DB), this method will
         * be executed again appending absolute path to storage again making that path non-existent and something like this:
         * `/var/www/larastarter/storage/app/public/var/www/larastarter/storage/app/public/uploads/image.jpg`.
         * To prevent this we check if model is dirty and only then append absolute path to storage. But this
         * does not prevent problem from happening when model is just updated without any of the fields changed
         * (in other word we persist non-dirty model).
         * In this case our safety check will return false and problem will arise again.
         * In order to prevent this we will manually replace absolute path to the storage with empty string
         * and prevent it from being saved in wrong way.
         * === LOOK INTO `set` METHOD BELLOW ===
         */
        if ($model->isDirty() || ! $data) {
            return $data;
        }

        // We handle images differently if they come from provider because these files are stored on external servers
        if (array_key_exists('from_provider', $data)) {
            return $data;
        }

        $data['path'] = array_key_exists('path', $data)
            ? public_storage_path($data['path'])
            : null;
        $data['url'] = array_key_exists('url', $data)
            ? storage_url($data['url'])
            : null;

        return $data;
    }

    public function set($model, string $key, $value, array $attributes)
    {
        if (! is_array($value)) {
            return null;
        }

        // We check if it comes from provider because these files are stored on external servers
        if (! array_key_exists('from_provider', $value)) {
            /**
             * In cases where absolute path/url for storage is added to path/url we are making sure
             * correct value is being stored in the database in form of only relative path/url.
             * Problem is explained in comment above in much more detail.
             */
            $value['path'] = str_replace(search: public_storage_path(), replace: '', subject: $value['path']);
            $value['url'] = str_replace(search: storage_url(), replace: '', subject: $value['url']);
        }

        return $value ? json_encode($value) : null;
    }
}

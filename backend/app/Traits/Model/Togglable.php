<?php

namespace App\Traits\Model;

/**
 * Trait for toggling boolean attributes which can be passed dynamically.
 */
trait Togglable
{
    public function toggle(string $attribute): bool
    {
        return $this->update([
            $attribute => ! $this->$attribute,
        ]);
    }
}

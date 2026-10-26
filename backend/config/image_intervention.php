<?php

return [

    /*
     |--------------------------------------------------------------------------
     | ProcessFileAction uses this configuration to determine how to handle files
     |--------------------------------------------------------------------------
     |
     |
     | Specify config which are conditionally used in ProcessFileAction if given value.
     |
     */

    /*
     * !IMPORTANT It is important to set the config back to specific values after the action is done.
     * For example when using in DatabaseSeeder, changing the config sets the value globally for running request.
     */

    'scale_down_width' => null,
    'scale_down_height' => null,
    'compress_quality' => 50,
];

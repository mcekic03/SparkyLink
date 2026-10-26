<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ config('app.name') }}</title>

    <!-- Fonts -->
    <link rel="preload" as="style"
          href="https://fonts.googleapis.com/css?family=Open%20Sans%3A400%2C400i%2C600%2C700%2C800%7COpen%20Sans%3A400%2C300%7CRaleway%3A600%2C700%2C500&amp;subset=latin-ext&amp;display=swap">

    <!-- Styles -->
    <style>
        /*! normalize.css v8.0.1 | MIT License | github.com/necolas/normalize.css */
        html {
            line-height: 1.15;
            -webkit-text-size-adjust: 100%
        }

        body {
            margin: 0
        }

        a {
            background-color: transparent
        }

        [hidden] {
            display: none
        }

        html {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
            line-height: 1.5
        }

        *, :after, :before {
            box-sizing: border-box;
            border: 0 solid #e2e8f0
        }

        a {
            text-decoration: none;
            display: flex;
        }

        .antialiased {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale
        }

        .container {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: #0145D4;
            padding-top: 1rem;
            padding-bottom: 1rem
        }

        @media (min-width: 640px) {
            .container {
                padding-top: 0;
            }
        }
    </style>

    <style>
        body {
            font-family: 'Raleway', sans-serif;
        }
    </style>
</head>
<body class="antialiased">
<div class="container">
    <a href="https://itcentar.rs/">
        <img src="https://itcentar.rs/wp-content/uploads/2023/11/itc-novi-logo-white-1.png" alt="IT Centar logo">
    </a>
</div>
</body>
</html>

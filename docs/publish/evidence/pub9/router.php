<?php
// php -S router for the disposable WordPress: real files and directory indexes pass through, everything else goes to WordPress.
$path = parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH );
$file = __DIR__ . $path;
if ( '/' !== $path && ( is_file( $file ) || ( is_dir( $file ) && is_file( rtrim( $file, '/' ) . '/index.php' ) ) ) ) { return false; }
require __DIR__ . '/index.php';

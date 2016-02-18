<?php

$credentials = [
    'database.host' => '',
    'database.port' => '',
    'database.basename' => 'inventory_1',
    'database.username' => 'root',
    'database.password' => '123'
];

$dataSourceName = [
    'mysql:host' => $credentials['database.host'],
    'dbname' => $credentials['database.basename'],
    'charset' => 'utf8'
];

foreach ($dataSourceName as $key => $value) {
    $dataSourceNameStrings[] = $key . '=' . $value;
}

$dataSourceName = implode(';', $dataSourceNameStrings);

$connection = new \PDO(
    $dataSourceName,
    $credentials['database.username'],
    $credentials['database.password']
);

return $connection;

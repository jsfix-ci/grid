<?php

$columns = isset($_GET['columns']) ? $_GET['columns'] : 0;

$connection = include '../connection.php';

$sql = ["insert into item"];
$sqlColumns = [];
$sqlValues = [];

foreach ($columns as $column => $value) {
    $sqlColumns[] = $column;
    $sqlValues[] = "'$value'";
}
$sql[] = '(' . implode(', ', $sqlColumns) . ')';
$sql[] = 'values';
$sql[] = '(' . implode(', ', $sqlValues) . ')';

$sth = $connection->query(implode(' ', $sql));

echo json_encode((object) [
    'rowCount' => $sth->rowCount()
]);

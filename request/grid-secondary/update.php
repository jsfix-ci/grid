<?php

$id = isset($_GET['id']) ? $_GET['id'] : 0;
$name = isset($_GET['name']) ? $_GET['name'] : 0;
$valueOk = isset($_GET['value']) ? $_GET['value'] : 0;

$connection = include '../connection.php';

$sql = ["update item set `$name` = '$valueOk' where id = $id"];
$sth = $connection->query(implode(' ', $sql));

echo json_encode((object) [
    'rowCount' => $sth ? $sth->rowCount() : null
]);

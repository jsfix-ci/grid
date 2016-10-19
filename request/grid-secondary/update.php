<?php

$id = isset($_POST['id']) ? $_POST['id'] : 0;
$name = isset($_POST['name']) ? $_POST['name'] : 0;
$valueOk = isset($_POST['value']) ? $_POST['value'] : 0;

$connection = include '../connection.php';

$sql = ["update item set `$name` = '$valueOk' where id = $id"];

$sth = $connection->query(implode(' ', $sql));

echo json_encode((object) [
    'rowCount' => $sth ? $sth->rowCount() : null
]);

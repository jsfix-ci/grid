<html>
<head>
	<meta charset="UTF-8">
	<title>Grid</title>
	<link rel="stylesheet" href="asset/common.css">
</head>
<body>
	<div class="grid-container js-grid-item-container"></div>
	<div class="grid-container js-grid-baby-container"></div>
	<script id="mst-grid" type="x-tmpl-mustache"><?php echo file_get_contents('grid.mst') ?></script>
	<script id="mst-grid-form-create" type="x-tmpl-mustache"><?php echo file_get_contents('grid-form-create.mst') ?></script>
	<script id="mst-grid-input" type="x-tmpl-mustache"><?php echo file_get_contents('grid-input.mst') ?></script>
	<script id="mst-grid-select" type="x-tmpl-mustache"><?php echo file_get_contents('grid-select.mst') ?></script>
	<script id="mst-grid-rows" type="x-tmpl-mustache"><?php echo file_get_contents('grid-rows.mst') ?></script>
	<script src="asset/common.js"></script>
</body>
</html>

function createNewElement() {
    // First create a DIV element.
	var newFileSelectBox = document.createElement('div');

    // Then add the content (a new input box) of the element.
	newFileSelectBox.innerHTML = "<form action='looma-video-upload.php' method='POST' enctype='multipart/form-data'>\
	<input type='file' name='myfile'> <p>File Name: <input type='text' name='displayname'> \
	<p> Author's Name: <input type='text' name='author'>   \
	<input type='submit' name='submit' value='Upload File'></form>";

    // Finally put it where it is supposed to appear.
	document.getElementById("newElementId").appendChild(newFileSelectBox);
}

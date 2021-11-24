


//$('#collection').val('text');
//$('#filesearch-ft').val('text');
function savefile(name, collection, filetype, data, activityFlag) {  //filetype must be given as (e.g.) 'text' or 'text-template'
    var collection2= "activities"
    if (name.length > 0) {
        if (data) {
            console.log('FILE COMMANDS: saving file (' + name + ') with ft: ' + filetype + 'and with data: ' + data+ 'in collection'+collection);
            $.post("looma-database-utilities.php",
                {
                    cmd: "save",
                    collection: collection,
                    dn: LOOMA.escapeHTML(name),
                    ft: filetype,
                    data: data,
                    activity: activityFlag      // NOTE: this is a STRING, either "false" or "true"
                },
                'json'  
            )   
            };
    }
}
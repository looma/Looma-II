db.activities.find({}).forEach(doc => {
  if(doc.src === 'PhET') {
      if (doc.ch_id) {
          let ch_ids = Object.values(doc.ch_id);
          
         // console.log('ch_id array is '+ ch_ids);
          
          db.activities.updateOne({"_id": doc._id}, [{$set: {"ch_id": ch_ids}}]);
      };
      if (doc.nch_id) {
          let nch_ids = Object.values(doc.nch_id);
    
         // console.log('nch_id array is '+ nch_ids);
        
          db.activities.updateOne({"_id": doc._id}, [{$set: {"nch_id": nch_ids}}]);
      };
  }
});
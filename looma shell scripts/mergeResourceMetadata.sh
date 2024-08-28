#!/bin/bash
#
# reads a file named "new metadata to merge.tsv"
#     containing a headerline with types [for example dn.string(), cl_lo.int32()]
#     merges each line of metadata into activities collection document that matches 'dn' and 'ft'
#
mongoimport --db=looma --collection=activities --type=tsv \
--headerline --ignoreBlanks --columnsHaveTypes --useArrayIndexFields \
--upsertFields="dn,ft" --mode=merge --file="../mongo-dump/new metadata to merge.tsv"

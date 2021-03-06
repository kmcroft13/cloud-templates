Meteor.methods({

    copyTemplate: function (items, dynamicRename) {
        console.log("### BEGIN copyTemplate METHOD ###");

        // check variable types
        check(items, Match.Any);
        check(dynamicRename, Match.Any);

        // set constants
        const userBoxId = Meteor.user().services.box.id;
        const target = FolderQueue.findOne({boxUserId: userBoxId}, {sort: {addedAt: -1}});
        const tokenExpiration = Meteor.user().services.box.expiresAt;
        const usesDynamicRename = dynamicRename.usesDynamicRename;
        const findReplaceArray = dynamicRename.findReplaceArray;

        // if Box token is expired, refresh token
        if (Date.now() - tokenExpiration > 0) {
            console.log("Token Expired");
            refreshAccessToken = Meteor.myFunctions.refreshToken();
        }

        // set target folder to copy items to
        if (Meteor.settings.public.environment == "dev") {
            targetFolderId = "7826540761"; // test folder for Dev
        } else if (target) {
            console.log("Setting target folder...");
            console.log(`Box ID: ${target.folderId} | Folder Name: ${target.folderName} | Box User ID: ${target.boxUserId}`);
            targetFolderId = target.folderId;
        } else {
            throw new Meteor.Error(400, "Target folder is unknown. Try launching this window directly by right-clicking on a Box folder.");
        }

        // create Box client
        const accessToken = Meteor.user().services.box.accessToken;
        const box = sdk.getBasicClient(accessToken);
        console.log(`Box Basic Client created: ${Meteor.user().profile.fullName}`);

        // begin copy
        console.log(`Copying template for ${Meteor.userId()} (userId) to "${target.folderName}" (${targetFolderId})...`);

        // array to push status of each copy
        const itemsCopyResult = [];

        // declare function to copy files
        function copyFile(id, name) {
            return Async.runSync(function (done) {
                box.files.copy(id, name, targetFolderId,
                    function (err, fileInfo) {
                        done(err, fileInfo);
                    }
                )
            });
        }

        // declare function to copy folders
        function copyFolder(id, name) {
            return Async.runSync(function (done) {
                box.folders.copy(id, name, targetFolderId,
                    function (err, folderInfo) {
                        done(err, folderInfo);
                    }
                )
            });
        }

        // loop through each item in the Template and copy to Target
        for (let item of items) {
            const id = item.id;
            let origName = item.name;
            let name = item.name;
            let newName = item.name;
            const type = item.type;

            // rename items if template uses Dynamic Rename
            if (usesDynamicRename) {
                for (let findReplace of findReplaceArray) {
                    const find = new RegExp(findReplace.find, "g");
                    const replace = findReplace.replace;
                    newName = newName.replace(find, replace);
                    if (name != newName) { // item needs to be renamed
                        name = newName;
                        console.log(JSON.stringify({
                            item: id,
                            action: "rename",
                            details: {
                                itemType: type,
                                oldName: origName,
                                newName: newName
                            },
                            callingMethod: "copyTemplate"
                        }));
                    } else {
                        console.log(JSON.stringify({
                            item: origName,
                            action: "skip",
                            details: "no match",
                            callingMethod: "copyTemplate"
                        }));
                    }
                }
            }

            console.log(`Copying item: ${id} | ${name} | ${type}`);

            if (type == "file") {
                const copyStatus = copyFile(id, name, type);

                if (copyStatus.result) { // copy file successful
                    if (origName != name) {
                        const itemCopyResult = {
                            type: "success with rename",
                            origName: origName,
                            name: copyStatus.result.name,
                            id: copyStatus.result.id
                        };
                        console.log(JSON.stringify(itemCopyResult));
                        itemsCopyResult.push(itemCopyResult);
                    } else {
                        const itemCopyResult = {
                            type: "success",
                            name: copyStatus.result.name,
                            id: copyStatus.result.id
                        };
                        console.log(JSON.stringify(itemCopyResult));
                        itemsCopyResult.push(itemCopyResult);
                    }
                } // end if copy file successful

                else if (copyStatus.error && copyStatus.error.response.body.code == "item_name_in_use") { // copy failed because of name conflict
                    console.log("Item name already exists. Renaming...");
                    for (let i = 1; i < 50; i++) {
                        const newName = `(${i}) ${name}`;
                        const copyStatus = copyFile(id, newName, type);

                        if (copyStatus.result) {
                            const itemCopyResult = {
                                type: "success with conflict",
                                name: copyStatus.result.name,
                                id: copyStatus.result.id
                            };
                            console.log(JSON.stringify(itemCopyResult));
                            itemsCopyResult.push(itemCopyResult);

                            break;
                        }
                        else {
                            console.log(`Name conflict not resolved: (${i}) ${name}`)
                        }
                    }
                } // end if copy failed for name conflict

                else { // copy failed for some other reason
                    const itemCopyResult = {
                        type: "error",
                        name: name,
                        status: copyStatus.error.response.body.status,
                        code: copyStatus.error.response.body.code,
                        message: copyStatus.error.response.body.message
                    };
                    console.log(JSON.stringify(itemCopyResult));
                    itemsCopyResult.push(itemCopyResult);
                } // end if copy unsuccessful for some other reason
            } // end if file

            else if (type == "folder") {
                const copyStatus = copyFolder(id, name, type);

                if (copyStatus.result) { // copy file successful
                    if (origName != name) {
                        const itemCopyResult = {
                            type: "success with rename",
                            origName: origName,
                            name: copyStatus.result.name,
                            id: copyStatus.result.id
                        };
                        console.log(JSON.stringify(itemCopyResult));
                        itemsCopyResult.push(itemCopyResult);
                    } else {
                        const itemCopyResult = {
                            type: "success",
                            name: copyStatus.result.name,
                            id: copyStatus.result.id
                        };
                        console.log(JSON.stringify(itemCopyResult));
                        itemsCopyResult.push(itemCopyResult);
                    }
                } // end if copy file successful

                else if (copyStatus.error && copyStatus.error.response.body.code == "item_name_in_use") { // copy failed because of name conflict
                    console.log("Item name already exists. Renaming...");
                    for (let i = 1; i < 50; i++) {
                        const newName = `(${i}) ${name}`;
                        const copyStatus = copyFolder(id, newName, type);

                        if (copyStatus.result) {
                            const itemCopyResult = {
                                type: "success with conflict",
                                name: copyStatus.result.name,
                                id: copyStatus.result.id
                            };
                            console.log(JSON.stringify(itemCopyResult));
                            itemsCopyResult.push(itemCopyResult);

                            break;
                        }
                        else {
                            console.log(`Name conflict not resolved: (${i}) ${name}`)
                        }
                    }
                } // end if copy failed for name conflict

                else { // copy failed for some other reason
                    const itemCopyResult = {
                        type: "error",
                        name: name,
                        status: copyStatus.error.response.body.status,
                        code: copyStatus.error.response.body.code,
                        message: copyStatus.error.response.body.message
                    };
                    console.log(JSON.stringify(itemCopyResult));
                    itemsCopyResult.push(itemCopyResult);
                } // end if copy unsuccessful for some other reason
            } // end if folder

            else {
                throw new Meteor.Error(400, "Item type is unknown.");
            }
        } // end for loop

        // TODO: implement findReplace for content after first level
        /*
         if (usesDynamicRename) {
         const renameResults = Meteor.myFunctions.renameContent2(itemsCopyResult, findReplaceArray, accessToken);
         }
         */
        console.log("### END copyTemplate METHOD ###");
        return itemsCopyResult;
    } // end 'copyTemplate' method

}); //end all methods

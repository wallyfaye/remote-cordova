var cordova_app = function (params) {

    // defaults
        var offline_connection_types = ['unknown', 'none']

    // params
        var print_debug_log = (typeof params.print_debug_log === 'boolean') ? params.print_debug_log : true;
        var enable_caching = (typeof params.enable_caching === 'boolean') ? params.enable_caching : true;
        var core_data = (typeof params.core_data !== 'undefined') ? params.core_data : {};

    // core
        var _app = {
            online: false,
            offline: false,
            platform: null,
            core_data: core_data,
            helpers: {
                each: function(object, callback){

                    // save the array/objects keys to an array
                        var this_key_array = Object.keys(object);
                        callback = (typeof callback === "undefined") ? function(){} : callback;

                    // loop through the objects keys
                        this_key_array.forEach(function(value){

                            // fire the callback with this items value and index as arguments
                                callback(object[value], value)

                        });

                }
            },
            FileSystemHelper: {

                writeLine: function(fileName, text, onSuccess, onError) {

                    var that = this;
                    var grantedBytes = 0;

                    window.requestFileSystem(LocalFileSystem.PERSISTENT, grantedBytes, function(fileSystem) {

                        that.deleteFile(fileName, function(){
                            that._createFile.call(that, fileSystem, fileName, text, onSuccess, onError);
                        }, function(error){
                            // error.message = "Deleting existing file failed.";
                            // onError.call(that, error);
                            that._createFile.call(that, fileSystem, fileName, text, onSuccess, onError);
                        })

                    }, function(error) {
                        error.message = "Request file system failed.";
                        onError.call(that, error);
                    });

                },

                _createFile: function(fileSystem, fileName, text, onSuccess, onError) {

                    var that = this;
                    var options = {
                        create: true,
                        exclusive: false
                    };

                    fileSystem.root.getFile(fileName, options, function(fileEntry) {
                        that._createFileWriter.call(that, fileEntry, text, onSuccess, onError);
                    }, function (error) {
                        error.message = "Failed creating file.";
                        onError.call(that, error);
                    });

                },

                _createFileWriter: function(fileEntry, text, onSuccess, onError) {

                    var that = this;
                    fileEntry.createWriter(function(fileWriter) {
                        var len = fileWriter.length;
                        fileWriter.seek(len);
                        fileWriter.write(text + '\n');
                        var message = "Wrote: " + text;
                        onSuccess.call(that, message);
                    }, function(error) {
                        error.message = "Unable to create file writer.";
                        onError.call(that, error);
                    });

                },

                readTextFromFile: function(fileName, onSuccess, onError) {
                    var that = this;

                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
                        that._getFileEntry.call(that, fileSystem, fileName, onSuccess, onError);
                    }, function(error) {
                        error.message = "Unable to request file system.";
                        onError.call(that, error);
                    });

                },

                _getFileEntry: function(fileSystem, fileName, onSuccess, onError) {

                    var that = this;
                    fileSystem.root.getFile(fileName, null, function(fileEntry) {
                        that._getFile.call(that, fileEntry, onSuccess, onError);
                    }, function(error) {
                        error.message = "Unable to get file entry for reading.";
                        onError.call(that, error);
                    });

                },

                _getFile: function(fileEntry, onSuccess, onError) {
                    var that = this;
                    fileEntry.file(function(file) {
                        that._getFileReader.call(that, file, onSuccess);
                    }, function(error) {
                        error.message = "Unable to get file for reading.";
                        onError.call(that, error);
                    });
                },

                _getFileReader: function(file, onSuccess) {
                    var that = this;
                    var reader = new FileReader();
                    reader.onloadend = function(evt) {
                        var textToWrite = evt.target.result;
                        onSuccess.call(that, textToWrite);
                    };

                    reader.readAsText(file);
                },

                deleteFile: function(fileName, onSuccess, onError) {
                    var that = this;

                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
                        that._getFileEntryForDelete.call(that, fileSystem, fileName, onSuccess, onError);
                    }, function(error) {
                        error.message = "Unable to retrieve file system.";
                        onError.call(that, error);
                    });
                },

                _getFileEntryForDelete: function(fileSystem, fileName, onSuccess, onError) {
                    var that = this;
                    fileSystem.root.getFile(fileName, null, function (fileEntry) {
                        that._removeFile.call(that, fileEntry, onSuccess, onError);
                    },
                    function(error) {
                        error.message = "Unable to find the file.";
                        onError.call(that, error)
                    });
                },

                _removeFile : function(fileEntry, onSuccess, onError) {
                    var that = this;
                    fileEntry.remove(function (entry) {
                        var message = "File removed.";
                        onSuccess.call(that, message);
                    }, function (error) {
                        error.message = "Unable to remove the file.";
                        onError.call(that, error)
                    });
                }
            },
            events: {
                deviceready: function(callback){

                    // assign defaults to parameters
                        callback = (typeof callback === 'undefined') ? function(){} : callback;

                    // when device ready event is triggered by cordova
                        document.addEventListener('deviceready', function(){

                            // event triggered, firing callback
                                callback();

                        }, false);

                },
                offline: function(callback){

                    // assign defaults to parameters
                        callback = (typeof callback === 'undefined') ? function(){} : callback;

                    // when device offline event is triggered by cordova-plugin-network-information
                        document.addEventListener('offline', function(){

                            // update the online and offline statuses
                                _app.offline = true;
                                _app.online = false;

                            // event triggered, firing callback
                                callback();

                        }, false);

                },
                online: function(callback){

                    // assign defaults to parameters
                        callback = (typeof callback === 'undefined') ? function(){} : callback;

                    // when device online event is triggered by cordova-plugin-network-information
                        document.addEventListener('online', function(){

                            // update the online and offline statuses
                                _app.offline = false;
                                _app.online = true;

                            // event triggered, firing callback
                                callback();

                        }, false);

                },
                push_notification_device_registered: function(registration_data, callback){

                    // assign defaults to parameters
                        callback = (typeof callback === 'undefined') ? function(){} : callback;

                    // check saved registration id
                        var new_registration_id = registration_data.registrationId;
                        var old_registration_id = localStorage.getItem('registrationId');

                    // if new registration id has changed
                        if (old_registration_id !== new_registration_id) {

                            // store the new device registration id
                                localStorage.setItem('registrationId', new_registration_id);

                            // save the new device registration id to the server [NOT DONE]

                        }

                    // event triggered, firing callback
                        callback(new_registration_id);
                },
                push_notification_error: function(error_data, callback){

                    // assign defaults to parameters
                        callback = (typeof callback === 'undefined') ? function(){} : callback;

                    // event triggered, firing callback
                        callback(error_data);

                },
                push_notification_received: function(notification_data, callback){

                    // assign defaults to parameters
                        callback = (typeof callback === 'undefined') ? function(){} : callback;

                    // event triggered, firing callback
                        callback(notification_data);

                }
            },
            push_notification_manager: function() {

                // init push notifications
                    _app.push = PushNotification.init({
                        "android": {
                            "senderID": "XXXXXXXX"
                        },
                        "ios": {
                            "sound": true,
                            "vibration": true,
                            "badge": true
                        },
                        "windows": {}
                    });

                // on device register
                    _app.push.on('registration', function(data) {

                        _app.events.push_notification_device_registered(data, function(registration_id){

                            _app._debug.add_log(['device registered', registration_id]);

                        });

                    });


                // on push noticiation error
                    _app.push.on('error', function(error) {

                        _app.events.push_notification_error(error, function(error_data){

                            _app._debug.add_log(["push error", error_data]);

                        });

                    });

                // on notification
                    _app.push.on('notification', function(data) {

                        _app.events.push_notification_received(data, function(push_data){

                            _app._debug.add_log(["notification", push_data]);

                        });

                    });

            },
            debug_manager: function () {

                // array of debug logs
                    var debug_data = [];

                // create dom element for debug logs
                    var create_debug_dom = function () {
                        var debug_dom = document.createElement('div');
                        debug_dom.setAttribute('id', 'debug_dom');
                        document.body.appendChild(debug_dom);
                    };

                // add a debug log
                    var add_log = function (debug_object) {
                        // add this object to the debug log
                            debug_data.push(debug_object);

                        // if debug dom printing is allowed and an object exists
                            if(print_debug_log && document.getElementById('debug_dom') != null){

                                // add debug log to the dom
                                    var this_debug_string = JSON.stringify(debug_object)
                                    var debug_item_element = document.createElement('p');
                                    debug_item_element.textContent = this_debug_string;
                                    document.getElementById('debug_dom').appendChild(debug_item_element);

                            }

                    }

                // if debug dom printing is allowed
                    if(print_debug_log){

                        // create a debug dom container
                            create_debug_dom();

                    }

                // returns:
                    return {
                        // the debug log array
                            debug_data: debug_data,
                        // an add debug log method
                            add_log: add_log
                    }

            },
            init: function () {

                // bind events
                    _app.events.online();
                    _app.events.offline();
                    _app.events.deviceready(function () {

                        // initialize debug_manager
                            _app._debug = new _app.debug_manager();

                        // set device platform
                            _app.platform = device.platform;

                        // check online status
                            if(_app.online){

                                // initialize push notifications
                                    // _app.push_notification_manager();

                                // check versions and get data
                                    _app._this_application_manager = new _app.application_manager();
                                    _app._this_application_manager.init(function () {

                                        // run app
                                            _app.launch_application('online');

                                    });

                            } else {

                                // run app
                                    _app.launch_application('offline');

                            }

                    });

            },
            launch_application: function(mode){

                var app_file_promises = [
                    new Promise(function(resolve, reject){

                        _app._this_application_manager.open_exisiting_file('app_styles.min.css', function(resource_loaded, local_file_path, file_data){
                            if(resource_loaded){
                                var link = document.createElement("link");
                                link.setAttribute("rel", "stylesheet")
                                link.setAttribute("href", cordova.file.dataDirectory + "app_styles.min.css")
                                link.onload = function(){
                                    resolve();
                                };
                                document.body.appendChild(link);

                            } else {
                                // throw error
                                reject("style problem");
                            }

                        })

                    }),
                    new Promise(function(resolve, reject){
                        _app._this_application_manager.open_exisiting_file('app_script.js', function(resource_loaded, local_file_path, file_data){
                            if(resource_loaded){

                                var script = document.createElement("script");
                                script.src = cordova.file.dataDirectory + "app_script.js";
                                script.onload = function(){
                                    resolve();
                                };
                                document.body.appendChild(script);

                            } else {
                                // throw error
                                reject("script problem");
                            }
                        })
                    })
                ];


                Promise.all(app_file_promises).then(function(){
                    rela_app(mode, _app);
                }).catch(function(err) {
                    _app._debug.add_log(err);
                });

            },
            application_manager: function () {

                var open_exisiting_file = function(local_path, callback){

                    _app.FileSystemHelper.readTextFromFile(local_path, function(success){

                        callback(true, local_path, success);

                    }, function(fail){

                        callback(false, local_path);

                    });

                };

                var download_file = function(remote_path, local_path, callback){

                    var fileTransfer = new FileTransfer();
                    var remote_file_name = remote_path;
                    var local_file_name = local_path;
                    var temp_file_name = cordova.file.dataDirectory + local_file_name;
                    fileTransfer.download(
                        remote_file_name,
                        temp_file_name,
                        function(fileEntry) {

                            fileEntry.file(function(file) {

                                var reader = new FileReader();

                                reader.onloadend = function(e) {

                                    var file_text = this.result;

                                    callback(true, local_file_name, file_text);

                                };

                                reader.readAsText(file);

                            }, function (error) {

                                callback(false, local_file_name);

                            });

                        },
                        function(error) {

                            callback(false, local_file_name);

                        }
                    );

                };

                var save_file = function(local_file_name, file_text, callback){
                    _app.FileSystemHelper.writeLine(local_file_name, file_text, function(success){

                        callback(true, local_file_name, success);

                    }, function(fail){

                        callback(false, local_file_name);

                    });
                }

                var delete_local_file = function(local_path, callback){
                    var local_file_name = local_path;
                    _app.FileSystemHelper.deleteFile(local_file_name, function(success){
                        callback(true, local_path);
                    }, function(fail){
                        callback(false, local_path);
                    });

                }

                var get_latest_version_info = function(callback){

                    var version_promises = [];

                    _app.helpers.each(_app.core_data, function(value_core_data, index_core_data){

                        switch(index_core_data){

                            case 'versions':

                                _app.helpers.each(value_core_data, function(value_resource_info, index_resource_info){

                                    var this_version_promise = new Promise(function(resolve, reject){
                                        var promise_return_data = value_resource_info;

                                        download_file(value_resource_info.remote_resource_url, value_resource_info.local_resource_path, function(remote_resource_loaded, local_file_path, file_data){
                                            if(!remote_resource_loaded){

                                                resolve({
                                                    'local_or_remote': 'remote',
                                                    'loaded': false,
                                                    'local_file_path': local_file_path
                                                });

                                            } else {

                                                resolve({
                                                    'local_or_remote': 'remote',
                                                    'loaded': true,
                                                    'local_file_path': local_file_path,
                                                    'file_data': file_data
                                                });
                                            }
                                        });

                                    });

                                    version_promises.push(this_version_promise);

                                });

                            break;

                        }

                    });

                    Promise.all(version_promises).then(function(promise_data){

                        var new_file_promises = [];
                        _app.helpers.each(promise_data, function(value_promise_data, index_promise_data){
                            if(value_promise_data.loaded){

                                var this_file_promise = new Promise(function(resolve, reject){

                                    open_exisiting_file(value_promise_data.local_file_path, function(resource_loaded, local_file_path, file_data){

                                        if(!resource_loaded){

                                            var new_file_data = value_promise_data.file_data;
                                            var new_file_path = value_promise_data.local_file_path;

                                            save_file(new_file_path, new_file_data, function(resource_saved, local_file_name, success){
                                                resolve();
                                            });

                                        } else {

                                            var new_file_data = value_promise_data.file_data;
                                            var new_file_path = value_promise_data.local_file_path;

                                            var old_file_data = file_data;
                                            var old_file_path = value_promise_data.local_file_path;
                                            var new_file_path_for_old_file = "old_" + old_file_path;

                                            save_file(new_file_path_for_old_file, old_file_data, function(resource_saved, local_file_name, success){

                                                if(success){
                                                    save_file(new_file_path, new_file_data, function(resource_saved, local_file_name, success){
                                                        resolve();
                                                    });
                                                } else {
                                                    resolve();
                                                }

                                            });

                                        }
                                    });

                                });
                                new_file_promises.push(this_file_promise);

                            }
                        });

                        Promise.all(new_file_promises).then(function(promise_data){
                            callback();
                        })

                    });

                };

                var compare_resource_versions_and_load = function(callback){
                    var new_resource_versions_filename = 'resource_versions.json';
                    var old_resource_versions_filename = 'old_resource_versions.json';
                    var new_resource_versions = null;
                    var old_resource_versions = null;
                    var old_resouce_exists = false;

                    var get_resource_data_from_files = function(callback){
                        open_exisiting_file(old_resource_versions_filename, function(resource_loaded, local_file_path, file_data){
                            if(resource_loaded){
                                old_resouce_exists = true;
                                old_resource_versions = JSON.parse(file_data);
                            }

                            open_exisiting_file(new_resource_versions_filename, function(resource_loaded, local_file_path, file_data){
                                if(resource_loaded){
                                    new_resource_versions = JSON.parse(file_data);
                                }
                                callback();
                            });

                        });
                    };

                    var init = function(){
                        var new_resource_promises = [];

                        _app.helpers.each(_app.core_data, function(value_core_data, index_core_data){
                            switch(index_core_data){
                                case 'scripts':
                                case 'styles':
                                    var this_resource_promise = new Promise(function(resolve, reject){
                                        var download_and_save_new_resources = (enable_caching) ? false : true;
                                        get_resource_data_from_files(function(){
                                            if(old_resource_versions == null){
                                                download_and_save_new_resources = true;
                                            } else {

                                                _app._debug.add_log(old_resource_versions['app_' + index_core_data]);
                                                _app._debug.add_log(new_resource_versions['app_' + index_core_data]);

                                                if(new_resource_versions['app_' + index_core_data] != old_resource_versions['app_' + index_core_data]){
                                                    download_and_save_new_resources = true;
                                                }
                                            }
                                            if(download_and_save_new_resources){
                                                var remote_resource_info = value_core_data[0];
                                                var remote_resource_url = remote_resource_info.remote_resource_url + "?" + (Math.floor(Math.random() * (100000 - 0)) + 0);
                                                download_file(remote_resource_url, remote_resource_info.local_resource_path, function(remote_resource_loaded, local_file_path, file_data){
                                                    if(remote_resource_loaded){
                                                        save_file(remote_resource_info.local_resource_path, file_data, function(resource_saved, local_file_name, success){
                                                            resolve();
                                                        });
                                                    } else {
                                                        resolve();
                                                    }
                                                });
                                            } else {
                                                resolve();
                                            }
                                        })

                                    });
                                    new_resource_promises.push(this_resource_promise);
                                break;

                            }
                        })

                        Promise.all(new_resource_promises).then(function(promise_data){
                            callback();
                        })


                    };

                    init();


                }

                var init = function (callback) {

                    get_latest_version_info(function(){
                        compare_resource_versions_and_load(function(){
                            callback();
                        });
                    });

                };

                return {
                    init: init,
                    download_file: download_file,
                    open_exisiting_file: open_exisiting_file,
                    save_file: save_file,
                    delete_local_file: delete_local_file
                }



            }


        };

    // return
        return _app;

};

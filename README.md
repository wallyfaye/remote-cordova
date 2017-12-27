# remote-cordova
This allows you to remotely inject code into your Cordova app without having to go through a round of an store app updates. This can be useful if you have a minor bug in the code and don't have time to submit another version update, because the essential app resources are loaded and can optionally be stored on the device.

## usage

>
    var this_app = new cordova_app({
        enable_caching: false,
        print_debug_log: false,
        core_data: {
            "scripts": [
                {
                    "remote_resource_url": encodeURI("//remote_resource/app_script.js"),
                    "local_resource_path": "app_script.js"
                }
            ],
            "versions": [
                {
                    "remote_resource_url": encodeURI("//remote_resource/model_versions.json"),
                    "local_resource_path": "model_versions.json"
                },
                {
                    "remote_resource_url": encodeURI("//remote_resource/resource_versions.json"),
                    "local_resource_path": "resource_versions.json"
                }
            ],
            "styles": [
                {
                    "remote_resource_url": encodeURI("//remote_resource/app_styles.min.css"),
                    "local_resource_path": "app_styles.min.css"
                }
            ]
        }
    });
    this_app.init();

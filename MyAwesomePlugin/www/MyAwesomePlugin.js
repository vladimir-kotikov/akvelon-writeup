var exec = require('cordova/exec');

exports.coolMethod = function(str1, str2, success, error) {

    if (!str1 || !str2 && error) {
        error("invalid arguments supplied");
    }

    if (success) {
        success("" + str1 + str2);
    }
};

exports.logCoolMessage = function (message) {
    console.log(mesage);
};

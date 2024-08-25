const fs = require("fs");

const fileDel = (filePath) => {
    fs.unlink(filePath, (err) => {
        if(err) throw err;
        console.log("Successfully deleted!")
    })
}

module.exports = fileDel;
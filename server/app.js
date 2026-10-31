const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
const port = 3000

app.listen(port, (err) => {
    if (err) {
        console.log('err :>> ', err);
    } else {
        console.log('Server running at port', port)
    }
})

app.all(/.*/, (req, res) => {
    res.status(404).json({ message: 'End point does not exist' });
});
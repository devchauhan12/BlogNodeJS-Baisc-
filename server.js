const express = require('express');
const multer = require('multer')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const app = express();
app.set('view engine', 'ejs')

app.use(express.static('public'));
app.use(express.static('upload'));
app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(cookieParser());

mongoose.connect('mongodb://localhost:27017/Blog')

const { userModel } = require('./schemas/userschema.js')
const { blogModel } = require('./schemas/blogschema.js')

const storage = multer.diskStorage(
    {
        destination: (req, file, cb) => {
            return cb(null, './upload')
        },
        filename: (req, file, cb) => {
            return cb(null, Date.now() + file.originalname)
        }
    }
)

var upload = multer({ storage: storage }).single('file');


const auth = (req, res, next) => {
    if (req.cookies.loginUsers) {
        next()
    } else {
        res.redirect('/login')
    }
}
const checkLogIn = (req, res, next) => {
    if (req.cookies.loginUsers) {
        res.redirect('/blogs');
    } else {
        res.locals.username = null;
        next();
    }
};
const checkLogged = (req, res, next) => {
    if (req.cookies.loginUsers) {
        next();
    } else {
        res.locals.username = null;
        next();
    }
};

app.get('/', checkLogged, (req, res) => {
    const user = req.cookies.loginUsers;
    res.render('./pages/home', { username: user ? user.username : null })
})

app.get('/blogs', auth, async (req, res) => {
    try {
        const blogs = await blogModel.find();
        const user = req.cookies.loginUsers;
        res.locals.username = user.username;
        res.render('./pages/blogs', { blogs: blogs, username: user.username });
    } catch (err) {
        console.log(err);
    }
})

app.get('/addblog', auth, (req, res) => {
    const user = req.cookies.loginUsers;
    res.render('./pages/addblog', { username: user ? user.username : null })
})

app.post('/addblog', async (req, res) => {
    upload(req, res, async () => {
        if (req.file) {
            const loggedInUser = req.cookies.loginUsers;
            var details = {
                title: req.body.title,
                description: req.body.description,
                blogimage: req.file.filename,
                username: loggedInUser.username
            }
            const blog = new blogModel(details)
            try {
                await blog.save();
                res.redirect('/blogs');
            } catch (error) {
                console.error(error);
            }
        } 
    })
})

app.get('/register', checkLogIn, (req, res) => {
    res.render('./pages/register')
})

app.post('/register', async (req, res) => {
    const users = req.body;
    try {
        const register = new userModel(users);
        await register.save();
        res.redirect('/login')
    } catch (err) {
        console.log(err);
    }
})

app.get('/login', checkLogIn, (req, res) => {
    res.render('./pages/login')
})

app.post('/login', async (req, res) => {
    let loginUser = req.body;
    try {
        const user = await userModel.findOne({ email: loginUser.email });
        if (user) {
            if (user.password === loginUser.password) {
                res.cookie('loginUsers', user, { maxAge: 60 * 60 * 1000 })
                res.redirect('/blogs');
            } else {
                res.redirect('/login')
            }
        } else {
            res.redirect('/register')
        }
    } catch (err) {
        console.log(err);
    }
})

app.get('/logout', (req, res) => {
    if (req.cookies.loginUsers) {
        res.clearCookie("loginUsers");
    }
    res.redirect('/')
})

app.listen(3000, () => {
    console.log(`server Start at http://localhost:3000`);
})
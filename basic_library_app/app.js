const express = require("express"),
expressSanitizer = require("express-sanitizer"),
methodOverride   = require("method-override"),
bodyParser       = require("body-parser"),
mongoose         = require("mongoose"),
app              = express();

mongoose.connect("mongodb://localhost:27017/library_app",{ useNewUrlParser: true,useUnifiedTopology: true, useFindAndModify:false});
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

////////////////////////////////////////////////////////////////////////////////////////////////

// SCHEMA STUFF

const studentSchema = new mongoose.Schema({
    name: String,
    roll_number: Number,
    fine:{
        type: Number,
        default:0
    },
    issued_books:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Book"
    }]
});

let Student = mongoose.model("Student",studentSchema);

const bookSchema = new mongoose.Schema({
    name: String,
    ISBN: String,
    book_serial_number: Number
});

let Book = mongoose.model("Book",bookSchema);

////////////////////////////////////////////////////////////////////////////////////////////////

// HOME PAGE

app.get("/",function(req,res){
    res.render("home");
});

////////////////////////////////////////////////////////////////////////////////////////////////

// REGISTER STUDENT STUFF

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
    var newStudent = new Student({
        name: req.body.firstName + " " + req.body.lastName,
        roll_number: req.body.rollNumber
    });
    Student.create(newStudent,function(err,user){
		if(err){
		    res.redirect("/register");
		}else{
            res.redirect("/");
        }
	})
});

///////////////////////////////////////////////////////////////////////////////////////////////////////

// ADD NEW BOOK TO DATABASE STUFF

app.get("/add_book",function(req,res){
    res.render("add_book");
});

app.post("/add_book",function(req,res){
    var newBook = new Book({
        name: req.body.bookName,
        ISBN: req.body.isbn,
        book_serial_number: req.body.bookNumber
    });
    Book.create(newBook,function(err,user){
		if(err){
		    res.redirect("/add_book");
		}else{
            res.redirect("/");
        }
	})
});

//////////////////////////////////////////////////////////////////////////////////////////////////////

// BOOK ISSUE STUFF

app.get("/issue/:specific_roll_number",function(req,res){
    Student.findOne({"roll_number":req.params.specific_roll_number},function(err,foundStudent){
        if(err){
            console.log(err);
            res.redirect("/info");
        }else if(!foundStudent){
            res.redirect("/");
        }else{
            res.render("issue",{foundedStudent:foundStudent});
        }
    })
    //res.render("issue",{foundUser:{issued_books:[]}});
});

app.post("/issue/:student_roll_number",function(req,res){
    Student.findOne({"roll_number":req.params.student_roll_number},function(err,foundStudent){
        if(err){
            console.log(err);
            res.redirect("/info");
        }else if(!foundStudent){
            res.redirect("/");
        }else{
            Book.findOne({"book_serial_number":req.body.specificBookNumber},function(err,foundBook){
                if(err){
                    console.log(err);
                    res.redirect("/info");
                }else if(!foundBook){
                    res.redirect("/");
                }else{
                    foundStudent.issued_books.push(foundBook);
                    foundStudent.save();
                    res.redirect("/");
                }
            })
        }
    })
})

//////////////////////////////////////////////////////////////////////////////////////////////////////

// BOOK RETURN STUFF

app.post("/return/:student_roll_number/:issued_book_position",function(req,res){
    Student.findOne({"roll_number":req.params.student_roll_number},function(err,foundStudent){
        if(err){
            console.log(err);
            res.redirect("/info");
        }else if(!foundStudent){
            res.redirect("/");
        }else{
            console.log(parseInt(req.params.issued_book_position));
            foundStudent.issued_books.splice(req.params.issued_book_position,1);
            foundStudent.save();
            res.redirect("/info");
        }
    })
})

/////////////////////////////////////////////////////////////////////////////////////////////////////

// STUDENT INFO STUFF

app.get("/info",function(req,res){
    res.render("info",{foundedStudent:{issued_books:[]}});
});

app.post("/info",function(req,res){
    Student.findOne({"roll_number":req.body.specificRollNumber}).populate('issued_books').exec(function(err,foundStudent){
        //console.log(foundStudent);
        if(err){
            console.log(err);
            res.redirect("/");
        }else if(!foundStudent){
            res.redirect("/info");
        }else{
            res.render("info",{foundedStudent:foundStudent});
        }
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////

// PORT STUFF

app.listen(3000,function(){
    console.log("library server started !!!");
});
var express = require('express');
var redis = require("redis");
var session = require('express-session');
var redisStore = require('connect-redis')(session);
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mysql = require('mysql');
//var client  = redis.createClient();
var client = redis.createClient(6379, 'edissred.9lj4wj.0001.use1.cache.amazonaws.com', {no_ready_check: true});

var app = express();

// configure app

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// use middleware
app.use(bodyParser());
app.use(cookieParser());
	
app.use(session({
	cookieName:'Edisscookie',
    secret: 'ssshhhhh',
    // create new redis store.
    store: new redisStore({ host: 'edissred.9lj4wj.0001.use1.cache.amazonaws.com', port: 6379, client: client,ttl :  260}),
    saveUninitialized: false,
    resave: false,
    cookie:{maxAge:900000}
}));


/*
//mysql connection
var pool = mysql.createPool({
	connectionLimit: 500,
	//host: 'edissdb.cf94n1xe54ku.us-east-1.rds.amazonaws.com',
	host: 'ec2-52-23-169-213.compute-1.amazonaws.com',
	port: '3306',
	user: 'root',
	password: 'rootpass',
	database: 'ecommerce'
});

*/
//mysql connection
var readpool = mysql.createPool({
	connectionLimit: 500,
	//host: 'edissdb.cf94n1xe54ku.us-east-1.rds.amazonaws.com',
	host: 'master-slavetest-914765535.us-east-1.elb.amazonaws.com',
	port: '3306',
	user: 'root',
	password: 'rootpass',
	database: 'ecommerce'
});

//mysql connection
var writepool = mysql.createPool({
	connectionLimit: 500,
	//host: 'edissdb.cf94n1xe54ku.us-east-1.rds.amazonaws.com',
	host: 'ec2-52-90-8-82.compute-1.amazonaws.com',
	port: '3306',
	user: 'root',
	password: 'rootpass',
	database: 'ecommerce'
});

//define routes

app.get('/', function (req,res){
	res.send('hello express');
});

app.get('/registerUser',function (req,res){
	res.render('vregisteruser');


});


app.post('/registerUser', function (req,res){

var fname = "'" + req.body.fname + "'";
var lname = "'" + req.body.lname + "'";
var address = "'" + req.body.address + "'";
var city = "'" + req.body.city + "'";
var state = "'" + req.body.state + "'";
var zip = "'" + req.body.zip + "'";
var email = "'" + req.body.email + "'";
var username = "'" + req.body.username + "'";
var password = "'" + req.body.password + "'";

if ( typeof req.body.fname == 'undefined')
{
  fname = null;
}
if ( typeof req.body.lname == 'undefined')
{
  lname = null;
}
if ( typeof req.body.address == 'undefined')
{
  address = null;
}
if ( typeof req.body.city == 'undefined')
{
  city = null;
}
if ( typeof req.body.state == 'undefined')
{
  state = null;
}
if ( typeof req.body.zip == 'undefined')
{
  zip = null;
}
if ( typeof req.body.email == 'undefined')
{
  email = null;
}
if ( typeof req.body.username == 'undefined')
{
  username = null;
}
if ( typeof req.body.password == 'undefined')
{
  password = null;
}

var querybuilder = "insert into registeredusers values (NULL," + username + "," + fname +"," + lname +","+ password + "," + address + "," + city + "," + state + "," + zip + "," + email + ",false)";

writepool.getConnection(function(err,connection){

connection.query(querybuilder, function(err,result){
	connection.release();
if(!err)
{
res.send('Your account has been registered');
}
else
{
	//console.log(querybuilder);
	//res.send(err);
	res.send('There was a problem with this action');
}
});
});

});

app.get('/login',function (req,res){
	res.render('vlogin');
	// render login form
});

app.post('/login', function (req,res){
// verify credentials and issue cookie
//console.log("inside login")
var username = req.body.username;
var password = req.body.password;
//console.log(username + password);
var querybuilder = 'select * from registeredusers where username="' + username + '" and password="'+ password + '"';

readpool.getConnection(function(err,connection){

connection.query(querybuilder, function(err,result){
	connection.release();
if(!err)
{
	
	if(result.length ==1)
	{
		if(req.session.username)
		{
		if(req.session.username == username)
		{
			//req.session.regenerate
			
			req.session.regenerate(function(err){
                req.session.username=result[0].username;
             //   console.log( req.session.username + "from if method");
                req.session.isadmin=result[0].isadmin;
                res.send('Welcome ' + result[0].firstname);	
                //res.send("Welcome " + fname);
                });

/*req.session.username=result[0].username;
req.session.isadmin=result[0].isadmin;
req.session.save( function(err) {
    req.session.reload( function (err) {
         res.render('index', { title: req.session.example });
    });
});*/
               // res.send('Welcome ' + result[0].firstname);	

		}
		else
		{
			//console.log( req.session.username + "from else method");
			//res.clearCookie('username');
			//res.clearCookie('isadmin');
		//	req.session.destroy();
		//	req.session.username = username;
			req.session.regenerate(function(){
                req.session.username=username;
                req.session.isadmin=result[0].isadmin;
                res.send('Welcome ' + result[0].firstname);
              //  res.send("Welcome " + fname);
                });	
		//	req.session.isadmin = result[0].isadmin;
			//res.cookie('username',username, {maxAge:900000});
			//res.cookie('isadmin',result[0].isadmin, {max:900000});
			//res.send('Welcome ' + result[0].firstname);
		}
		}
		else
		{
		//	console.log( req.session.username + "from final else method");
			req.session.username = username;
			req.session.isadmin = result[0].isadmin;
			//res.cookie('username',username, {maxAge:900000});
			//res.cookie('isadmin',result[0].isadmin, {max:900000});
			res.send('Welcome ' + result[0].firstname);
		}
		
		
	

	}
	else
	{
		res.send('That username and password combination was not correct');
	}


}
else
{
	//console.log(error);
	res.send('There seems to be an issue with the username/password combination that you entered')
}



});
});
});

app.get('/logout',function (req,res){
	res.render('vlogout');


});

app.post('/logout', function (req,res){
	if(req.session.username)
	{
		req.session.destroy();
		//res.clearCookie('username');
		//res.clearCookie('isadmin');
	res.send("You have been logged out");
}
else
{
	res.send('You are not currently logged in');
}
// verify session and kill cookie
});

app.get('/updateInfo',function (req,res){
	res.render('vregisteruser');


});

app.post('/updateInfo', function (req,res){

if(req.session.username)
{
//console.log(req.session.key["isadmin"]);

var isadministrator = req.session.isadmin;	
var fname = "'" + req.body.fname + "'";
var lname = "'" + req.body.lname + "'";
var address = "'" + req.body.address + "'";
var city = "'" + req.body.city + "'";
var state = "'" + req.body.state + "'";
var zip = "'" + req.body.zip + "'";
var email = "'" + req.body.email + "'";
var username = "'" + req.body.username + "'";
var password = "'" + req.body.password + "'";

if ( typeof req.body.fname == 'undefined')
{
  fname = null;
}
if ( typeof req.body.lname == 'undefined')
{
  lname = null;
}
if ( typeof req.body.address == 'undefined')
{
  address = null;
}
if ( typeof req.body.city == 'undefined')
{
  city = null;
}
if ( typeof req.body.state == 'undefined')
{
  state = null;
}
if ( typeof req.body.zip == 'undefined')
{
  zip = null;
}
if ( typeof req.body.email == 'undefined')
{
  email = null;
}
if ( typeof req.body.username == 'undefined')
{
  username = null;
}
if ( typeof req.body.password == 'undefined')
{
  password = null;
}



var querybuilder = "update registeredusers set firstname = ifnull(" + fname + ",firstname),lastname = ifnull(" + lname + ",lastname), address = ifnull(" + address + ",address),city = ifnull(" + city + ",city),  state = ifnull(" + state + ",state), zip = ifnull(" + zip + ",zip), email = ifnull(" + email + ",email), username = ifnull(" + username + ",username),password = ifnull(" + password + ",password) where username = '" + req.session.username + "';";
//console.log(querybuilder);
writepool.getConnection(function(err,connection){

connection.query(querybuilder, function(err,result){
	connection.release();
if(!err)
{
	if(username != null)
{

//req.session.destroy();
//req.session.regenerate(function(){
                req.session.username=req.body.username;
                req.session.isadmin=isadministrator;
              //  res.send("Welcome " + fname);
  //              });	
//req.session.username = req.body.username;
//req.session.isadmin = isadministrator;
	//res.clearCookie('username');
//res.cookie('username',req.body.username, {maxAge:900000});	
}
res.send('Your information has been updated');
}
else
{
	res.send('There was a problem with this action');
}
});
});
}
else
{
	res.send('You must be logged in to perform this action');
}
});

app.get('/addProducts',function (req,res){
	res.render('vaddproducts');


});

app.post('/addProducts', function (req,res){

if(req.session.username)
{
	if(req.session.isadmin == 1)
	{

var asin = "'" + req.body.asin + "'" ;
var productname = "'" + req.body.name + "'";
var productDescription = "'" + req.body.productDescription + "'";
var group = "'" + req.body.group + "'";


if ( typeof req.body.asin == 'undefined')
{
  asin = null;
}
if ( typeof req.body.name == 'undefined')
{
  productname = null;
}
if ( typeof req.body.productDescription == 'undefined')
{
  productDescription = null;
}
if ( typeof req.body.group == 'undefined')
{
  password = null;
}



var querybuilder = "insert into productcatalog values(" + asin + "," + productname + "," + productDescription + "," + group + ")";
//console.log(querybuilder);
writepool.getConnection(function(err,connection){

connection.query(querybuilder, function(err,result){
	connection.release();
if(!err)
{
	
res.send('The product has been added to the system');
}
else
{
	res.send('There was a problem with this action');
}
});
});
}
else
{
	res.send('Only admin can perform this action');
}
}
else
{
	res.send('You must be logged in to perform this action');
}
});

app.get('/modifyProduct',function (req,res){
	res.render('vaddproducts');


});

app.post('/modifyProduct', function (req,res){

if(req.session.username)
{
	if(req.session.isadmin == 1)
	{

var asin = "'" + req.body.asin + "'";
var productname = "'" + req.body.name + "'";
var productDescription = "'" + req.body.productDescription + "'";


if ( typeof req.body.asin == 'undefined')
{
  asin = null;
}
if ( typeof req.body.name == 'undefined')
{
  productname = null;
}
if ( typeof req.body.productDescription == 'undefined')
{
  productDescription = null;
}


var querybuilder = "update productcatalog set productname = " + productname + ", description = " + productDescription + " where asin = " + asin ;
//console.log(querybuilder);
writepool.getConnection(function(err,connection){

connection.query(querybuilder, function(err,result){
	connection.release();
if(!err)
{
	//console.log(result);
	if( result.affectedRows > 0)
	{
		res.send('The product information has been updated');
	}
	else
	{
		res.send('There was a problem with this action');
	}
}
else
{
	res.send('There was a problem with this action');
}
});
});
}
else
{
	res.send('Only admin can perform this action');
}
}
else
{
	res.send('You must be logged in to perform this action');
}
});

app.get('/viewUsers',function (req,res){
	res.render('vaddproducts');


});

app.post('/viewUsers', function (req,res){

if(req.session.username)
{
	if(req.session.isadmin == 1)
	{

var fname = req.body.fname ;
var lname = req.body.lname;
if (fname == "''")
{
	fname = "";
} 
if(lname == "''")
{
	lname = "";
}
var arr = [];

if(typeof fname == 'undefined' && typeof lname == 'undefined')
{
var querybuilder = "select firstname,lastname from registeredusers ";
//console.log(querybuilder);
readpool.getConnection(function(err,connection){

connection.query(querybuilder, function(err,result){
	connection.release();
if(!err)
{
	//JSONArray jArray = new JSONArray();
	
	for(var i=0;i < result.length ;i++){
   arr.push({fname: result[i].firstname, lname: result[i].lastname});
	}
res.contentType('application/json');
	res.send(JSON.stringify(arr));	
}
else
{
	res.send('There was a problem with this action');
}
});
});	
//console.log(arr);
}
else
{
if ( typeof lname != 'undefined' && typeof fname == 'undefined')
{
var querybuilder = "select firstname,lastname from registeredusers where (lastname like '%" + lname + "%')";
//console.log(querybuilder);
readpool.getConnection(function(err,connection){

connection.query(querybuilder, function(err,result){
	connection.release();
if(!err)
{
	//JSONArray jArray = new JSONArray();
	
	for(var i=0;i < result.length ;i++){
   arr.push({fname: result[i].firstname, lname: result[i].lastname});
	}
res.contentType('application/json');
	res.send(JSON.stringify(arr));	
}
else
{
	res.send('There was a problem with this action');
}
});
}); 
}
if ( typeof fname != 'undefined' && typeof lname == 'undefined')
{
  var querybuilder = "select firstname,lastname from registeredusers where (firstname like '%" + fname + "%')";
//console.log(querybuilder);
readpool.getConnection(function(err,connection){

connection.query(querybuilder, function(err,result){
	connection.release();
if(!err)
{
	//JSONArray jArray = new JSONArray();
	
	for(var i=0;i < result.length ;i++){
   arr.push({fname: result[i].firstname, lname: result[i].lastname});
	}
	res.contentType('application/json');
	res.send(JSON.stringify(arr));
}
else
{
	res.send('There was a problem with this action');
}
});
});
}

if ( typeof fname != 'undefined' && typeof lname != 'undefined')
{
	var querybuilder = "select firstname,lastname from registeredusers where (firstname like '%" + fname + "%') or (lastname like '%" + lname + "%')";
//console.log(querybuilder);
readpool.getConnection(function(err,connection){

connection.query(querybuilder, function(err,result){
	connection.release();
if(!err)
{
	//JSONArray jArray = new JSONArray();
	
	for(var i=0;i < result.length ;i++){
   arr.push({fname: result[i].firstname, lname: result[i].lastname});
	}
	res.contentType('application/json');
	res.send(JSON.stringify(arr));
}
else
{
	res.send('There was a problem with this action');
}
});
});
}
//console.log(arr);
}
//console.log(arr);
//res.contentType('application/json');
//	res.send(JSON.stringify(arr));
}
else
{
	res.send('Only admin can perform this action');
}
}
else
{
	res.send('You must be logged in to perform this action');
}
});

app.get('/viewProducts',function (req,res){
	res.render('vaddproducts');


});

app.post('/viewProducts', function (req,res){


var asin = req.body.asin ;
var group = req.body.categories;
var keyword = req.body.keyword;
var querybuilder = "";
if ( typeof asin == 'undefined' && typeof group == 'undefined' &&  typeof keyword == 'undefined')
{
	querybuilder = "select productname from productcatalog limit 1000";
}
else
{
	querybuilder = "select productname from productcatalog where ";
if ( typeof asin != 'undefined')
{
	//if(asin != '')
	//{
  querybuilder = querybuilder + "(asin = '" + asin + "') or ";
	//}
	/*else
	{
		querybuilder = querybuilder + "(asin = null) or ";
	}*/
}
if ( typeof group != 'undefined')
{
  querybuilder = querybuilder + "(productgroup = '" + group + "') or ";
}
if ( typeof keyword != 'undefined')
{

keyword = keyword.trim();
/*var keysplit = keyword.split(" ");
var keylength = keysplit.length;

if(keylength == 1)
{
  querybuilder = querybuilder + "(match(productname,description) against('" + keyword + "*' in boolean mode)) or ";
  //querybuilder = querybuilder + "(match(productname,description) against('" + keyword + "')) and ";
 }
 else
 {
 	*/
  querybuilder = querybuilder + "(match(productname,description) against('\"" + keyword + "\"')) or ";
//}
}
querybuilder = querybuilder.substring(0,querybuilder.length - 3);	
querybuilder = querybuilder + " limit 1000";
}


//var querybuilder = "select name from productcatalog where (asin = " + asin + ") or (productgroup = '" + group + "') or (name like '%" + keyword + "%') or (description like '%" + keyword +"%')";
//console.log(querybuilder);
readpool.getConnection(function(err,connection){

connection.query(querybuilder, function(err,result){
	connection.release();
if(!err)
{
	if(result.length != 0)
	{
	
/*
	//JSONArray jArray = new JSONArray();
	var arr = [];
	for(var i=0;i < result.length ;i++){
   arr.push({name: result[i].productname });

	}
	res.contentType('application/json');
	res.send(JSON.stringify(arr));
	*/

	var finalResults = "product_list:[{name:"
                    for(var i=0;i<result.length;i++){
                          if(i){
                            finalResults += ',name:';
                          }
                     finalResults+=result[i]["productname"];
                     finalResults += '}'
                    }
                    finalResults += ']'
              //  }
                    res.send(finalResults);

}
else
{
	//console.log(querybuilder);
	res.send('There were no products in the system that met that criteria');
}
}
else
{
	//console.log(err);
	res.send('There was a problem with this action');
}
});
});




});

app.get('/buyProducts',function (req,res){
	res.render('vlogout');


});

app.post('/buyProducts', function (req,res){
	if(req.session.username)
	{
		var sessionname = req.session.username;

		var asin = req.body.asin ;
		 var temp = asin.replace("[","");
            var list = temp.replace("]","").split(",");
            var values="";
            var total=0;
            for(var i=0;i<list.length;i++){
                if(total){
                    values += ',';
                }
                values += `('${list[i]}','${sessionname}')`;
                total++;
            }

        var querybuilder = 'insert into purchasehistory (asin,username) VALUES ' + values;        
		
	writepool.getConnection(function(err,connection){

connection.query(querybuilder, function(err,result){
	connection.release();
if(!err)
{
  var temp = asin.replace("[","");
            var list = temp.replace("]","").split(",").slice().sort();
            var results = [];
            for (var i = 0; i < list.length; i++) {
                if (i+1 < list.length && list[i + 1] == list[i]) {
                    continue;
                }
                results.push(list[i]);
            }
            if(results.length>1)
            {
                        var total =0;
                        var values = "";
                        for(var i=0;i<results.length;i++){
                            for(var j=0;j<results.length;j++){
                                if(i==j){
                                    continue;
                                }
                                if(total){
                                    values +=',';
                                }
                            values +=`('${results[i]}','${results[j]}')`;
                            total++;
                        }
                    }
                }

                writepool.getConnection(function(err,connection){

	connection.query('insert into recommendation (asin,alsoBought) values '+values, function(err,result){
	connection.release();
if(!err)
{
	res.send('The product information has been updated');
}
else
{
	res.send('There was a problem with this action');
}
});
});
}
else
{
	//console.log(err);
	res.send('There was a problem with this action');
}
});
});
}
else
{
	res.send('You are not currently logged in');
}
// verify session and kill cookie
});


app.get('/productsPurchased',function (req,res){
	res.render('vlogout');


});

app.post('/productsPurchased', function (req,res){

if(req.session.username)
{
	if(req.session.isadmin == 1)
	{

var username = req.body.username;

var querybuilder = "select pc.productname,count(*) as quantity from purchasehistory ph, productcatalog pc where ph.username='"+username+"' and ph.asin=pc.asin group by ph.asin" ;
//console.log(querybuilder);
readpool.getConnection(function(err,connection){

connection.query(querybuilder, function(err,result){
	connection.release();
if(!err)
{
	if(result.length > 0){
                    //res.send(results);
                    var finalResults = "product_purchased:{"
                    for(var i=0;i<result.length;i++){
                          if(i){
                            finalResults += ',';
                          }
                     finalResults+=result[i]["productname"];
                    }
                	
                    finalResults += '}'
                res.send(finalResults);
            }
            else
            {
            	res.send('There was a problem with this action');
            }
	
}
else
{
	res.send('There was a problem with this action');
}
});
});
}
else
{
	res.send('Only admin can perform this action');
}
}
else
{
	res.send('You must be logged in to perform this action');
}
});



app.get('/getRecommendations',function (req,res){
	res.render('vlogout');


});

app.post('/getRecommendations', function (req,res){
	
	var asin = req.body.asin;

//var querybuilder = "select productname from productcatalog join (select alsobought from recommendation where asin='" + asin + "' group by alsobought limit 5) as r on productcatalog.asin = r.alsobought" ;
var querybuilder = "select productname from productcatalog join (select alsobought from recommendation where asin='" + asin + "' group by alsobought order by count(*) desc limit 5) as r on productcatalog.asin = r.alsobought" ;

//console.log(querybuilder);
readpool.getConnection(function(err,connection){

connection.query(querybuilder, function(err,result){
	connection.release();
if(!err)
{
	  if(result.length > 0){
                    //res.send(results);
                    var finalResults = ""
                    for(var i=0;i<result.length;i++){
                          if(i){
                            finalResults += ',';
                          }
                     finalResults+=result[i]["productname"];
                    }
                    res.send(finalResults);
                }
                    
            else
            {
            	res.send('There was a problem with this action');
            }
	
}
else
{
	res.send('There was a problem with this action');
}
});
});

});



app.listen(3000);

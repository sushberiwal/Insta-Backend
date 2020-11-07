// npm init -y
// npm install express
// npm install nodemon
//npm install uuid
// create server

const express = require("express");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const connection = require("./db/connection");
const cors = require("cors");
// express => to create server easily
// image upload
const multer  = require('multer')
// server is creeated
const app = express();
// if you want to see data in req.body
app.use(express.json());
app.use(cors());
// application => localhost => 3001 , backend localhost :3000
app.use(express.static('public'));



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if(file.fieldname == "postImage"){
      cb(null , 'public/posts')
    }
    else{
      cb(null, 'public/user');
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now()+".jpg");
  }
})


function fileFilter (req, file, cb) {
  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted
 let mimetype = file.mimetype;
 // // To accept the file pass `true`, like so:
 if(mimetype.includes("image")){
   cb(null, true);
 }
 // // To reject this file pass `false`, like so:
 else{
   cb(new Error('Selected file is not an Image !!!'), false)
 }
}



const upload = multer({ storage: storage,fileFilter : fileFilter })

 


// create a user => details aayengi req.body
function createUser(newUser) {
  return new Promise((resolve, reject) => {
    // insert details in table
    let uid = newUser.uid;
    let name = newUser.name;
    let handle = newUser.handle;
    let email = newUser.email;
    let bio = newUser.bio;
    let phone = newUser.phone;
    let isPublic = newUser.isPublic;
    let pImage = newUser.pImage;
    // console.log(uid , name , handle , email , bio , phone , isPublic);
    let sql = `INSERT INTO user_table(uid , name , handle , email , bio , phone , is_public , pImage) VALUES ( "${uid}" , "${name}" , "${handle}" , "${email}" , "${bio}" ,"${phone}" , ${isPublic} , '${pImage}' )`;
    // promise
    connection.query(sql, function (error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}
app.post("/user", upload.single('photo') , async function (req, res) {
  try {
    let uid = uuidv4();
    let newUser = req.body;
    newUser.uid = uid;
    let pImage = "/user/"+req.file.filename;
    newUser.pImage = pImage;
    console.log(newUser);
    let data = await createUser(newUser); //pending promise => resolve
    res.json({
      message: "user added succesfully",
      data: data,
    });
  } catch (err) {
    res.json({
      message: "user creation failed !!",
      data: err,
    });
  }
});

// get all userDB
function getAllUsers() {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM user_table`;
    connection.query(sql, function (error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}
app.get("/user", async function (req, res) {
  try {
    let data = await getAllUsers();
    res.json({
      message: "got all users succesfully",
      users: data,
    });
  } catch (err) {
    res.json({
      message: "get all users failed !!",
      error: err,
    });
  }
});

// get by id
function getUserById(uid) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM user_table WHERE uid = "${uid}" `;
    connection.query(sql, function (error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}
app.get("/user/:uid", async function (req, res) {
  try {
    let uid = req.params.uid;
    let data = await getUserById(uid);
    res.json({
      message: "get user by id succesfully",
      user: data[0],
    });
  } catch (err) {
    res.json({
      message: "Failed to get by id",
      error: err,
    });
  }
});

// update by id
function updateUserById(uid, updateObject) {
  return new Promise((resolve, reject) => {
    
    // UPDATE user_table
    // SET
    // name = "" , handle = "" , is_public = ""
    // WHERE uid = "";
    let sql = `UPDATE user_table SET`;
    for (key in updateObject) {
      if(updateObject[key]){
        sql += ` ${key} = "${updateObject[key]}" ,`;
      }
    }
    sql = sql.slice(0, -1);
    sql += ` WHERE uid = "${uid}"`;

    console.log(sql);

    connection.query(sql, function (error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}
app.patch("/user/:uid", upload.single('photo') ,async function (req, res) {
  try {
    let uid = req.params.uid;
    let updateObject = req.body;
    // console.log(req.file);
    if(req.file){
      let pImage = "/user/"+req.file.filename;
      updateObject.pImage = pImage;
    }
    console.log(updateObject);
    let data = await updateUserById(uid, updateObject);
    res.json({
      message: "USer updated succesfully",
      data: data,
    });
  } catch (err) {
    res.json({
      message: "failed to update user",
      error: err,
    });
  }
});

// delete by id
function deleteById(uid) {
  return new Promise((resolve, reject) => {
    let sql = `DELETE FROM user_table WHERE uid = "${uid}"`;
    connection.query(sql, function (error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}
app.delete("/user/:uid", async function (req, res) {
  try {
    let uid = req.params.uid;
    let data = await deleteById(uid);
    res.json({
      message: "user deleted succesfully",
      data: data,
    });
  } catch (err) {
    res.json({
      message: "Failed to delete user",
      error: err,
    });
  }
});

//requests=>SEND REQUEST , ACCEPT REQUEST , CANCEL REQUEST , SEE PENDING REQUEST , GET FOLLOWING , GET COUNT OF FOLLOWING , GET FOLLOWERS , GET COUNT OF FOLLOWERS , UNFOLLOW

// send request
function addInFollowingTable(isPublic, uid, followId) {
  return new Promise((resolve, reject) => {
    let sql = `INSERT INTO user_following(uid , follow_id , is_accepted ) VALUES ( "${uid}" , "${followId}" , ${isPublic} )`;
    connection.query(sql, function (error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}
function addInFollowerTable(uid, followerId) {
  return new Promise((resolve, reject) => {
    let sql = `INSERT INTO user_follower(uid , follower_id) VALUES ( "${uid}" , "${followerId}" )`;
    connection.query(sql, function (error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}
app.post("/user/request", async function (req, res) {
  try {
    // object destructuring
    let { uid, follow_id } = req.body;
    let user = await getUserById(follow_id);
    let isPublic = user[0].is_public;
    // falsy values => undefined , 0 , false , null , ""
    if (isPublic) {
      let followingData = await addInFollowingTable(true, uid, follow_id);
      let followerData = await addInFollowerTable(follow_id, uid);
      res.json({
        message: "Request Sent and accepted !!",
        data: { followerData, followingData },
      });
    } else {
      let data = await addInFollowingTable(false, uid, follow_id);
      res.json({
        message: "Request sent and pending !!!",
        data: data,
      });
    }
  } catch (error) {
    res.json({
      message: "Failed to send request",
      error: error,
    });
  }
});


// accept request
function acceptRequest(followId , uid){
    return new Promise( (resolve , reject)=>{
        let sql = `UPDATE user_following SET is_accepted = true WHERE uid = "${uid}" and follow_id = "${followId}" `;
        connection.query(sql , function(error , data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })

    });

}
app.post("/user/request/accept",async function (req, res) {
  try {
    let {uid , toBeAccepted } = req.body;
    let acceptdata = await acceptRequest(uid , toBeAccepted);
    let followerData = await addInFollowerTable( uid , toBeAccepted );
    res.json({
        message:"Request Accepted !!",
        data : {acceptdata , followerData}
    })
  } catch (error) {
    res.json({
      message: "Failed to accept request !!",
      error: error,
    });
  }
});


// cancel request
function cancelRequest(uid , followId){
    return new Promise((resolve , reject)=>{
        let sql = `DELETE FROM user_following WHERE uid = "${uid}" AND follow_id = "${followId}"`;
        connection.query(sql , function(error , data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
app.post("/user/request/cancel" , async function(req , res){
    try{
        let {uid , toBeCancel } = req.body;
        let data = await cancelRequest(uid , toBeCancel);
        res.json({
            message:"follow request cancelled !!",
            data : data
        })
    }
    catch(error){
        res.json({
            message: "Failed to cancel request !!",
            error: error,
          }); 
    }
})

// see pending request
function getPendingIds(followId){
return new Promise((resolve , reject)=>{
    let sql = `SELECT uid FROM user_following WHERE follow_id = "${followId}" AND is_accepted = FALSE`;
    connection.query(sql , function(error , data){
        if(error){
            reject(error);
        }
        else{
            resolve(data);
        }
    })
})
}
app.get("/user/request/:uid" , async function(req , res){
    try{
        let {uid} = req.params;
        let pendingIds = await getPendingIds(uid);
        // console.log(pendingIds);
        let pendingRequests = [];
        for(let i=0 ; i<pendingIds.length ; i++){
            let {uid} = pendingIds[i];
            let user = await getUserById(uid);
            pendingRequests.push(user[0]);
        }
        res.json({
            message:"Succesfully got all pending requests !!!",
            data : pendingRequests
        })
    }
    catch(error){
        res.json({
            message:"failed to get all pending request",
            error : error
        })
    }
})


// unfollow
function removeFromFollowing(uid , followId){
    return new Promise((resolve , reject)=>{
        let sql = `DELETE FROM user_following WHERE uid = "${uid}" AND follow_id="${followId}"`;
        connection.query(sql ,function(error , data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
function removeFromFollower(uid , followerId){
    return new Promise((resolve , reject)=>{
        let sql = `DELETE FROM user_follower WHERE uid = "${uid}" AND follower_id="${followerId}"`;
        connection.query(sql ,function(error , data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
app.post("/user/request/unfollow", async function (req, res) {
    try {
      // object destructuring
      let { uid, follow_id } = req.body;
      let followingData = await removeFromFollowing(uid , follow_id);
      let followerData =  await removeFromFollower(follow_id , uid);
      res.json({
          message:"removed following succesfully",
          data : {followerData , followingData}
      })
    } catch (error) {
      res.json({
        message: "Failed to unfollow",
        error: error,
      });
    }
  });

  
// get following
function getFollowingIds(uid){
    return new Promise((resolve , reject)=>{
        let sql = `SELECT follow_id FROM user_following WHERE uid = "${uid}" AND is_accepted = true`;
        connection.query(sql , function(error ,data){
            if(error){
                reject(error);
            }
            else{
                resolve(data);
            }
        })
    })
}
app.get("/user/following/:uid" , async function(req , res){
    try{
        let {uid} = req.params;
        let followingIds = await getFollowingIds(uid);
        // console.log(followingIds);
        let followingUsers = [];
        for(let i=0 ; i<followingIds.length ; i++){
            let followId = followingIds[i].follow_id;
            let user = await getUserById(followId);
            followingUsers.push(user[0]);
        }
        // console.log(followingUsers);
        res.json({
            message:"got all following",
            data : followingUsers
        })
    }
    catch(error){
        res.json({
            message:"failed to get following !",
            error:error
        })
    }
})


// get followers
function getFollowersId(uid){
      return new Promise((resolve , reject)=>{
          let sql = `SELECT follower_id FROM user_follower WHERE uid = "${uid}"`;
          connection.query(sql , function(error ,data){
              if(error){
                  reject(error);
              }
              else{
                  resolve(data);
              }
          }) 
      })
}

app.get("/user/follower/:uid" , async function(req , res){
    try{
        let {uid }= req.params;
        let followerIds  = await getFollowersId(uid);
        console.log(followerIds);
        let followerUsers = [];
        for(let i=0 ; i<followerIds.length ; i++){
            let followerId = followerIds[i].follower_id;
            let user = await getUserById(followerId);
            followerUsers.push(user[0]);
        }
        res.json({
            message:"got all followers succesfully",
            data: followerUsers 
        })
    }
    catch(error){
        res.json({
            message:"Failed to get all followers !!",
            error : error
        })
    }
})

// frontend => package.json => "proxy" => "http://localhost:3000"

// user => create a user , get user by id , get all users , update a user , delete a user

// sql => post table => pid  , uid , caption , postImage , createAt =>
// POSTS => create a post , get post by uid , get all posts , update a post , delete a post pid


// ui component => POSTS => state => postlist => componeent did mount => get all posts => postList = [ {} , {} , {} ]; 
// Post component => 


function createPost(postObject){
  return new Promise((resolve , reject)=>{
    
    let {pid , uid , postImage , caption } = postObject;

    const date = new Date();
    console.log(date);
    let createdAt = date.toISOString().slice(0,19).replace('T',' ');
    console.log(createdAt);
    postObject.createdAt = createdAt;
    let sql = `INSERT INTO post (pid , uid , postImage , caption , createdAt ) VALUES('${pid}' , '${uid}' , '${postImage}' , '${caption}' , '${createdAt}')`;
    connection.query(sql , function(error , data){
      if(error){
        reject(error);
      }
      else{
        resolve(data);
      }
    })
  })
}
// app.post method => /post
app.post("/post" , upload.single("postImage") , async function(req , res){
  try{
    let pid = uuidv4(); // unique post id
    let postObject = req.body;
    postObject.pid = pid;

    let postImage = "/posts/"+ req.file.filename;
    // console.log(req.file);
    postObject.postImage = postImage;
    console.log(postObject);
    let postData = await createPost(postObject);
    res.json({
      message:"post created succesfully",
      data: postData
    })
  }
  catch(error){
    res.json({
      message:"Failed to create post !!",
      error : error
    })
  }
})


// get all posts 
function getAllPosts(){
  return new Promise((resolve , reject)=>{
    let sql = `SELECT * FROM post ORDER BY createdAt DESC`;
    connection.query(sql , function(error , data){
      if(error){
        reject(error);
      }
      else{
        resolve(data);
      }
    })
  })
}
app.get("/post" , async function(req , res){
  try{
    let postData = await getAllPosts();
    res.json({
      message:"Succesfully got all posts !!",
      data : postData
    })
  }
  catch(error){
    res.json({
      message:"failed to get all posts",
      error:error

    })
  }
})

// get post by id
function getPostById(uid){
  return new Promise((resolve , reject)=>{
    let sql = `SELECT * FROM post WHERE uid = "${uid}" ORDER BY createdAt DESC`;
    connection.query(sql , function(error , data){
      if(error){
        reject(error);
      }
      else{
        resolve(data);
      }
    })
  })
}
app.get("/post/:uid" , async function(req,res){
  try{
    let {uid} = req.params;
    let postData = await getPostById(uid);
    res.json({
      message:"succesfully get all post by id",
      data : postData
    })
  }
  catch(error){
    res.json({
      message:"Failed tp get post by id",
      error:error
    })
  }
})

// update a post
function updateCaption(pid , caption){
  return new Promise((resolve , reject)=>{
    let sql = `UPDATE post SET caption = "${caption}" WHERE pid = "${pid}"`;
    connection.query(sql , function(error , data){
      if(error){
        reject(error);
      }
      else{
        resolve(data);
      }
    })
  })
}
app.patch("/post" , async function(req,res){
  try{
    let {pid,caption} = req.body;
    let updateData =await updateCaption(pid , caption);
    res.json({
      message:"caption updated",
      data:updateData
    })

  }
  catch(error){
    res.json({
      message:"failed to update caption",
      error:error
    })
  }
})

// delete a post
function deletePostById(pid){
  return new Promise((resolve , reject)=>{
    let sql = `DELETE FROM post WHERE pid = "${pid}"`;
    connection.query(sql , function(error, data){
      if(error){
        reject(error);
      }
      else{
        resolve(data);
      }
    })
  })
}
app.delete("/post/:pid" , async function(req,res){
  try{
    let {pid} =req.params; 
    let deleteData = await deletePostById(pid);
    res.json({
      message:"deleted succesfully",
      data : deleteData
    })
  }
  catch(error){
    res.json({
      message:"failed to delete post !!",
      error : error
    })
  }
})




// suggestions => 
// let us test thi keyboard


// app.post("/image" , upload.single('photo') ,   function(req , res){
//   console.log(req.body); // text data in req.body
//   console.log(req.file); // image in req.file
//   console.log(req.files); // multiple images comes in req.files
//   res.json({
//     message:"received image succesfully"
//   })
// })



let port = process.env.PORT || 4000;
app.listen(port, function () {
  console.log("server is listening at 4000 port !!");
});

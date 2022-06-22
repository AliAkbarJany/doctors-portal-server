/*
// BHAI>>>>>>>>>
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.twtll.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8fz9j.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db('doctors_portal').collection('services');
    const bookingCollection = client.db('doctors_portal').collection('bookings');

    app.get('/service', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // Warning: This is not the proper way to query multiple collection. 
    // After learning more about mongodb. use aggregate, lookup, pipeline, match, group
    app.get('/available', async(req, res) =>{
      const date = req.query.date;

      // step 1:  get all services
      const services = await serviceCollection.find().toArray();

      // step 2: get the booking of that day. output: [{}, {}, {}, {}, {}, {}]
      const query = {date: date};
      const bookings = await bookingCollection.find(query).toArray();

      // step 3: for each service
      services.forEach(service=>{
        // step 4: find bookings for that service. output: [{}, {}, {}, {}]
        const serviceBookings = bookings.filter(book => book.treatment === service.name);
        // step 5: select slots for the service Bookings: ['', '', '', '']
        const bookedSlots = serviceBookings.map(book => book.slot);
        // step 6: select those slots that are not in bookedSlots
        const available = service.slots.filter(slot => !bookedSlots.includes(slot));
        //step 7: set available to slots to make it easier 
        service.slots = available;
      });
     

      res.send(services);
    })

    
     * API Naming Convention
     * app.get('/booking') // get all bookings in this collection. or get more than one or by filter
     * app.get('/booking/:id') // get a specific booking 
     * app.post('/booking') // add a new booking
     * app.patch('/booking/:id) //
     * app.delete('/booking/:id) //
    

    app.get('/booking', async(req, res) =>{
      const patient = req.query.patient;
      const query = {patient: patient};
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    })

    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists })
      }
      const result = await bookingCollection.insertOne(booking);
      return res.send({ success: true, result });
    })

  }
  finally {

  }
}

run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello From Doctor Uncle!')
})

app.listen(port, () => {
  console.log(`Doctors App listening on port ${port}`)
})

BHAI */




// MY CODE>>>>>>>>>>>>>>>>>>>>> 

const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000;
// JWT(TOken)... mod 75(3)...
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8fz9j.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri)

async function run() {
    try {
        await client.connect()
        console.log('database connected')
        const servicesCollection = client.db('doctors_portal').collection('services');
        const bookingCollection = client.db('doctors_portal').collection('bookings');
        const userCollection = client.db('doctors_portal').collection('users');
        const doctorCollection = client.db('doctors_portal').collection('doctors');
        


        // API Naming Convation...

        // 1.app.get('/booking) //  get/Read all bookings or more than one
        // 2.app.get('/booking/:id) // get/Read specific/single booking

        // 3.app.post('/booking) // Add/post/create a/one/1 booking

        // 4.app.patch('/bookking/:id) // upadate specific/single booking
        // 5.app.delete('/booking/:id) // Delete specific/single booking.



        // JWT VERIFY....mod 75(5)
        function verifyJwt(req,res,next){
          console.log('ABCCC')
          const authHeader=req.headers.authorization;
          if(!authHeader){
            return res.status(401).send({message:'Unauthorize Access'})
          }
          const token=authHeader.split(' ')[1];
          jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
            if(err){
              return res.status(403).send({message:'Forbidden Access'})
            }
            console.log(decoded) 
            req.decoded=decoded;
            next();
          });
        }

        // mod 76(5).....
        const verifyAdmin= async(req,res,next)=>{
          // mod 75(8)....
          const requester=req.decoded.email;
          // data base thake khjtesi j (requester) er (role) ta ki..
          const requesterAccount=await userCollection.findOne({email:requester})
          // mod 75(8)....
          if(requesterAccount.role==='Admin'){
            next()
          }
          else{
            res.status(403).send({message:'Forbidden'})
          }
        }

        // Read/get all serevices...72(8)
        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = servicesCollection.find(query).project({name:1})
            const services = await cursor.toArray()
            res.send(services)
        })

        // mod 75(6....)
        // Read/Get all users...
        // (Users) component...
        app.get('/user',verifyJwt, async(req,res)=>{
          const users=await userCollection.find().toArray();
          res.send(users)
        })
        // mod 75(8)....
        // Admin.....
        app.get('/admin/:email', async(req,res)=>{
          const email=req.params.email;
          const user=await userCollection.findOne({email:email})
          const isAdmin=user.role==='Admin'
          res.send({admin:isAdmin})

        })
        
        // 75(7)....
        // ADMIN....
        // (UseRow) component...
        app.put('/user/admin/:email', verifyJwt, async (req,res)=>{
          const email=req.params.email;

          // mod 75(8)....
          const requester=req.decoded.email;
          // data base thake khjtesi j (requester) er (role) ta ki..
          const requesterAccount=await userCollection.findOne({email:requester})
          // mod 75(8)....
          if(requesterAccount.role==='Admin'){
            const filter={email:email};
          const updateDoc = {
            $set: {role:'Admin'},
          };
          const result=await userCollection.updateOne(filter,updateDoc)
          res.send(result)
          }
          else{
            res.status(403).send({message:'Forbidden'})
          }
        })

        // mod..75(1)
        // PUT/UPDATE......

        app.put('/user/:email',async (req,res)=>{
          const email=req.params.email;
          const user=req.body;
          const filter={email:email};
          const options = { upsert: true };
          const updateDoc = {
            $set: user,
          };
          const result=await userCollection.updateOne(filter,updateDoc,options)
 
          // JWT(token)... mod 75(3)...
          const token=jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '10h' })
          res.send({result,token})
          // res.send(result)
        })

        //  Create/post a booking data...

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            console.log('booking', booking)
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query)

            if (exists) {
                // console.log('Exists', exists)
                return res.send({ success: false, booking: exists })
            }

            const result = await bookingCollection.insertOne(booking)
            return res.send({ success: true, result })

        })

        // mod 76(4).......
        // (Doctor) add...
        app.post('/doctor',verifyJwt,verifyAdmin, async(req,res)=>{
          const doctor=req.body;
          const result=await doctorCollection.insertOne(doctor)
          res.send(result);
        })

        // mod 76(5)..
        // Doctor 
        app.get('/doctor',verifyJwt,verifyAdmin, async(req,res)=>{
          const doctors =await doctorCollection.find().toArray();
          res.send(doctors)
        })

        // mod 76(6)..
        app.delete('/doctor/:email',verifyJwt,verifyAdmin, async(req,res)=>{
          const email=req.params.email;
          const query={email:email}
          const result=await doctorCollection.deleteOne(query)
          res.send(result);

        })


        

        // Read/get booking for (MyAppointment)...
        // mod 74(8)....

        app.get('/booking', verifyJwt, async (req, res) => {
            const patient = req.query.patient;
            // mod 75(4)....
            /*
            const authorization=req.headers.authorization;
            console.log('auth header',authorization)
            */

           // mod 75(5)....
           const decodedEmail=req.decoded.email
           if(patient===decodedEmail){
            const query = { patient: patient }
            const bookings = await bookingCollection.find(query).toArray();
            return res.send(bookings)
           }

           else{
            return res.status(403).send({message:'forbiden access'})
           } 
        })

        // warning::
        // this is not the proper way to (query)
        // after learning more about (mongodb). use (aggregated lookup),(pipeline),(match), (group)

        app.get('/available', async (req, res) => {
            const date = req.query.date

            // step 1: get/Read all Services.....
            const services = await servicesCollection.find().toArray()
            // res.send(services);

            // step 2: get/Read the booking of That day...output[{},{},{},{},{},{}]
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();

            // step:3: for each service,
            services.forEach(service => {
                // ai kahne 1ta service er jonno 1ta booking khoja hosse..
                //  find bookings for that service..  output [{},{},{}]
                const serviceBooking = bookings.filter(book => book.treatment === service.name)

                // step:5 select slots for the service booking . output ['','','',]
                const bookedSlots = serviceBooking.map(book => book.slot);

                // (service.booked) means (services) er vetor (booked) nam-a ekta new (property of object khola)
                service.booked = bookedSlots;

                // step 6: select those slots that are not in (bookedSlots)
                const available = service.slots.filter(slot => !bookedSlots.includes(slot))
                service.available = available;
                service.slots = available
            })

            res.send(services)
        })



    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('hello from doctor portal')
})

app.listen(port, () => {
    console.log('listening to port', port)
    console.log(`doctors port ${port}`)
})

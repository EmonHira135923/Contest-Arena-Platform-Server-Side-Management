const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@creative.js7cnic.mongodb.net/?appName=Creative`;

// Middleware 
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173'], // Add your frontend URL
  credentials: true
}));

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });

    const database = client.db("creativeArenaDB");
    const contestsCollection = database.collection("contests");
    const usersCollection = database.collection("users");
    const submissionsCollection = database.collection("submissions");

    // 🔹 Get all approved contests + search by contest type
    app.get("/contests", async (req, res) => {
      try {
        const { type } = req.query;
        const query = { status: "approved" };

        if (type) {
          query.contestType = { $regex: type, $options: "i" };
        }

        const contests = await contestsCollection.find(query).toArray();
        res.send(contests);
      } catch (error) {
        console.error("Error fetching contests:", error);
        res.status(500).send({ message: "Failed to fetch contests" });
      }
    });

    // 🔹 Alternative endpoint that matches your frontend call
    app.get("/contest", async (req, res) => {
      try {
        const { type } = req.query;
        const query = { status: "approved" };

        if (type) {
          query.contestType = { $regex: type, $options: "i" };
        }

        const contests = await contestsCollection.find(query).toArray();
        res.send(contests);
      } catch (error) {
        console.error("Error fetching contests:", error);
        res.status(500).send({ message: "Failed to fetch contests" });
      }
    });

    // 🔹 Get single contest by ID
    app.get("/contests/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const contest = await contestsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!contest) {
          return res.status(404).send({ message: "Contest not found" });
        }

        res.send(contest);
      } catch (error) {
        console.error("Error fetching contest:", error);
        res.status(500).send({ message: "Failed to fetch contest" });
      }
    });

    // 🔹 Add new contest (Creator)
    app.post("/contests", async (req, res) => {
      try {
        const contest = req.body;
        contest.status = "pending";
        contest.participants = 0;
        contest.createdAt = new Date();

        const result = await contestsCollection.insertOne(contest);
        res.send({
          success: true,
          message: "Contest submitted for approval",
          data: result
        });
      } catch (error) {
        console.error("Error adding contest:", error);
        res.status(500).send({ message: "Failed to add contest" });
      }
    });

    // 🔹 Save user info (after login)
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const existingUser = await usersCollection.findOne({ email: user.email });

        if (existingUser) {
          return res.send({ 
            success: true, 
            message: "User already exists",
            user: existingUser 
          });
        }

        user.role = "user";
        user.createdAt = new Date();

        const result = await usersCollection.insertOne(user);
        res.send({
          success: true,
          message: "User created successfully",
          data: result,
          user: { ...user, _id: result.insertedId }
        });
      } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).send({ message: "Failed to save user" });
      }
    });

    // 🔹 Get user by email
    app.get("/users/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }

        res.send(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).send({ message: "Failed to fetch user" });
      }
    });

    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Creative Arena Server is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
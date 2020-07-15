const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const knex = require("knex")({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "naomitodd",
    password: "",
    database: "smart-brain"
  }
});

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send(database.users);
});

app.post("/signin", (req, res) => {
  const { email, password } = req.body;
  knex
    .select("email", "hash")
    .from("login")
    .where({ email })
    .then(([data]) => {
      const isValid = bcrypt.compareSync(password, data.hash);
      if (isValid) {
        return knex
          .select("*")
          .from("users")
          .where({ email })
          .then(([user]) => {
            res.json(user);
          })
          .catch(err => res.status(400).json("unable to get user"));
      } else {
        res.status(400).json("wrong credentials");
      }
    })
    .catch(err => res.status(400).json("wrong credentials"));
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  knex
    .transaction(trx => {
      trx
        .insert({
          hash,
          email
        })
        .into("login")
        .returning("email")
        .then(([loginEmail]) => {
          return trx("users")
            .returning("*")
            .insert({
              email: loginEmail,
              name,
              joined: new Date()
            })
            .then(([user]) => {
              res.json(user);
            });
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })

    .catch(err => res.status(400).json("unable to register"));
});

app.get("/profile/:id", (req, res) => {
  const { id } = req.params;

  knex
    .select("*")
    .from("users")
    .where({ id })
    .then(([user]) => {
      if (user) res.json(user);
      else res.status(404).json("no such user");
    })
    .catch(err => {
      res.status(400).json("error getting user");
    });
});

app.put("/image", (req, res) => {
  const { id } = req.body;

  knex("users")
    .where({ id })
    .increment("entries", 1)
    .returning("entries")
    .then(([entries]) => {
      res.json(entries);
    })
    .catch(err => res.status(400).json("unable to get entries"));
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});

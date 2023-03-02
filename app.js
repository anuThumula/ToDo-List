const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const app = express();

app.use(express.json());
let db;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, "todoApplication.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on 3000");
    });
  } catch (error) {
    console.log(`DataBase error is ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

///API 1 to 6
//1
const priorityAndStatusProp = (requestQ) => {
  return requestQ.priority !== undefined && requestQ.status !== undefined;
};

//2

const priorityProp = (requestQ) => {
  return requestQ.priority !== undefined;
};

//3

const statusProp = (requestQ) => {
  return requestQ.status !== undefined;
};

//4

const categoryAndStatus = (requestQ) => {
  return requestQ.category !== undefined && requestQ.status !== undefined;
};

//5

const categoryAndPriority = (requestQ) => {
  return requestQ.category !== undefined && requestQ.priority !== undefined;
};

//6

const searchProp = (requestQ) => {
  return requestQ.search_q !== undefined;
};

//7

const categoryProp = (requestQ) => {
  return requestQ.category !== undefined;
};

//8

const result = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    category: dbObj.category,
    status: dbObj.status,
    dueDate: dbObj.due_date,
  };
};

///API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQ = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    //3
    case priorityAndStatusProp(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQ = ` 
                    SELECT * FROM todo
                    WHERE status = '${status}' AND priority = '${priority}';`;
          data = await db.all(getTodoQ);
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    //5

    case categoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQ = `select * from todo where category = '${category}' and status='${status}';`;
          data = await db.all(getTodoQ);
          response.send(data.map((eachItem) => result(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //7
    case categoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQ = `select * from todo where category = '${category}' and priority='${priority}';`;
          data = await db.all(getTodoQ);
          response.send(data.map((eachItem) => result(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //1

    case statusProp(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQ = `select * from todo where status = '${status}';`;
        data = await db.all(getTodoQ);
        response.send(data.map((eachItem) => result(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //2
    case priorityProp(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQ = `
                  SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await db.all(getTodoQ);
        response.send(data.map((eachItem) => result(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //4

    case searchProp(request.query):
      getTodoQ = `select * from todo where todo list '%${search_q}%';`;
      data = await db.all(getTodoQ);
      response.send(data.map((eachItem) => result(eachItem)));
      break;

    //6
    case categoryProp(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQ = `select * from todo where category = '${category}';`;
        data = await db.all(getTodoQ);
        response.send(data.map((eachItem) => result(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodoQ = `select * from todo;`;
      data = await db.all(getTodoQ);
      response.send(data.map((eachItem) => result(eachItem)));
  }
});

///API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQ = `select * from todo where id= ${todoId};`;
  const ans = await db.get(getTodoQ);
  response.send(result(ans));
});

///API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const reqQ = `select * from todo where due_date='${newDate}';`;
    const resAns = await db.all(reqQ);
    response.send(resAns.map((eachItem) => result(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

////API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const oldNewDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postAndInsertTodoQ = `
                             INSERT INTO
                             todo (id,todo,category,priority,status,due_date)
                             VALUES
                             (${id},'${todo}','${category}','${priority}','${status}','${oldNewDate}');`;
          await db.run(postAndInsertTodoQ);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

////API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateValue = "";
  const reqBody = request.body;
  console.log(reqBody);
  const oldTodoQ = `select * from todo where id = ${todoId};`;
  const oldtodos = await db.get(oldTodoQ);
  const {
    todo = oldtodos.todo,
    priority = oldtodos.priority,
    status = oldtodos.status,
    category = oldtodos.category,
    dueDate = oldtodos.dueDate,
  } = request.body;

  let updateTodosQ;
  switch (true) {
    case reqBody.status !== undefined:
      if (status === "To Do" || status === "IN PROGRESS" || status === "DONE") {
        updateTodosQ = `
                UPDATE todo 
                SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',
                due_dte='${dueDate}'
                WHERE id = ${todoId};`;
        await db.run(updateTodosQ);
        response.send(`Status Updated`); //////
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    case reqBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodosQ = `
              UPDATE todo 
              SET todo = '${todo}',priority='${priority}',status='${status}',category='${category}',
              due_date='${dueDate}' where id = ${todoId};`;
        await db.run(updateTodosQ);
        response.send(`Priority Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case reqBody.todo !== undefined:
      updateTodosQ = `
              UPDATE todo
              SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',
              due_date='${dueDate}'
              WHERE id = ${todoId};`;

      await db.run(updateTodosQ);
      response.send(`Todo Updated`);
      break;

    case reqBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodosQ = `
                      UPDATE todo 
                      SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',
              due_date='${dueDate}'
              WHERE id = ${todoId};`;

        await db.run(updateTodosQ);
        response.send(`Category Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case reqBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodosQ = `
                  UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',
              due_date='${dueDate}'
              WHERE id = ${todoId};`;
        await db.run(updateTodosQ);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

///API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQ = `
    DELETE FROM 
    todo 
    WHERE 
    id = ${todoId};`;

  await db.run(deleteTodoQ);
  response.send("Todo Deleted");
});

module.exports = app;

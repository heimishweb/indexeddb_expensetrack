
let transactions = [];
let myChart;

fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    // save db data on global variable
    transactions = data;

    populateTotal();
    populateTable();
    populateChart();
  });

function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: "Total Over Time",
        fill: true,
        backgroundColor: "#6666ff",
        data
      }]
    }
  });
}

function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();

  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
    .then(response => {
      return response.json();
    })
    .then(data => {
      if (data.errors) {
        errorEl.textContent = "Missing Information";
      }
      else {
        // clear form
        nameEl.value = "";
        amountEl.value = "";
      }
    })
    .catch(err => {
      // fetch failed, so save in indexed db
      console.log("!!!!!! " + JSON.stringify(transaction))
      var transactionObject = JSON.stringify(transaction);
      saveRecord(transactionObject);
     
      function saveRecord(transactionObject) {
        const request = window.indexedDB.open("expense", 1);

        // Create schema
        request.onupgradeneeded = event => {
          const db = event.target.result;

          // Creates an object store with a listID keypath that can be used to query on.
          const expenseStore = db.createObjectStore("expense", { keyPath: "name" });
          // Creates a statusIndex that we can query on.
          expenseStore.createIndex("statusIndex", "value");
        }

        // Opens a transaction, accesses the expense objectStore and statusIndex.
        request.onsuccess = () => {
          var nameOfThing = transactionObject.name
          console.log(nameOfThing + " is the name of thing")
          var valueOfThing = transactionObject.value
          console.log("not crazy")


          const db = request.result;
          const transaction = db.transaction(["expense"], "readwrite");
          const expenseStore = transaction.objectStore("expense");
          const statusIndex = expenseStore.index("statusIndex");

          // Adds data to our objectStore
          expenseStore.add({ name: nameOfThing , value: valueOfThing  });

          //get allData so far; added by me 03/15/2020
          var allData = expenseStore.getAll();
          console.log(allData); //RETURNS OBJECT
          // expenseStore.add({ listID: allData, status: allData }) //doesn't like it
          //send allData to local storage or indexedDB or somewhere else in internet.

          //   $("#getAll").on("click", function () {
          //     console.log(allData.result);

          //   })

          // Return an item by keyPath
          const getRequest = expenseStore.get("1");
          getRequest.onsuccess = () => {
            console.log(getRequest.result);
          };

          // Return an item by index
          const getRequestIdx = statusIndex.getAll("complete");
          getRequestIdx.onsuccess = () => {
            console.log(getRequestIdx.result);
          };
        };
      }
      // clear form
      nameEl.value = "";
      amountEl.value = "";
    });
}

document.querySelector("#add-btn").onclick = function () {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function () {
  sendTransaction(false);
};

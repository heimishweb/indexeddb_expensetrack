

$("#add-btn").on("click", function () {
    insertDB();
});


function insertDB(inTransaction) {

    const request = window.indexedDB.open("expense", 1);

    // Create schema
    request.onupgradeneeded = event => {
        const db = event.target.result;

        // Creates an object store with a listID keypath that can be used to query on.
        const expenseStore = db.createObjectStore("expense", { keyPath: "listID" });
        // Creates a statusIndex that we can query on.
        expenseStore.createIndex("statusIndex", "status");
    }

    // Opens a transaction, accesses the expense objectStore and statusIndex.
    request.onsuccess = () => {
        var nameOfThing = $("#t-name").val();
        console.log(nameOfThing + " is the name of thing")
        var valueOfThing = $("#t-amount").val();
        console.log("not crazy")


        const db = request.result;
        const transaction = db.transaction(["expense"], "readwrite");
        const expenseStore = transaction.objectStore("expense");
        const statusIndex = expenseStore.index("statusIndex");

        // Adds data to our objectStore
        expenseStore.add({ listID: nameOfThing, status: valueOfThing });

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
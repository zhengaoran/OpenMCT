const columns = ['id', 'timestamp', 'value'];
let history = [];
let newData = [];
let showPwrc = true;
let showPwrv = true;
let order = 'desc';
const max = 1000;

let pwrc = document.getElementById('pwrc');
let pwrv = document.getElementById('pwrv');
let sortBtn = document.getElementById('sort-btn');

var pwrcConnection = new WebSocket("ws://localhost:8080/realtime");
var pwrvConnection = new WebSocket("ws://localhost:8080/realtime");

// handle click on pwrc checkbox
pwrc.addEventListener('click', (event) => {
  showPwrc = event.target.checked;
  if (showPwrc) {
    pwrcConnection.send('subscribe pwr.c');
  } else {
    // unsubscribe and delete pwrc data from table;
    pwrcConnection.send('unsubscribe pwr.c');
    history = history.filter(data => data.id !== 'pwr.c');
    newData = newData.filter(data => data.id !== 'pwr.c');
    renderHistoryTable();
  }
});
// handle click on pwrv checkbox
pwrv.addEventListener('click', (event) => {
  showPwrv = event.target.checked;
  if (showPwrv) {
    pwrvConnection.send('subscribe pwr.v');
  } else {
    // unsubscribe and delete pwrv data from table;
    pwrvConnection.send('unsubscribe pwr.v');
    history = history.filter(data => data.id !== 'pwr.v');
    newData = newData.filter(data => data.id !== 'pwr.v');
    renderHistoryTable();
  }
});
// handle click on sort button
sortBtn.addEventListener('click', () => {
  order = order === 'asc' ? 'desc' : 'asc';
  sortBtn.innerHTML = order;
  renderHistoryTable();
});

// render table
const renderHistoryTable = () => {
  const tableBody = document.getElementById('table-body');
  tableBody.innerHTML="";
  const data = [...history, ...newData];
  sortData(data);

  for (let row of data) {
    const tr = document.createElement('tr')
    
    for (let column of columns) {
      const td = document.createElement('td');
      
      if (column === 'timestamp') {
        td.innerHTML = new Date(row[column]).toISOString();
      } else {
        td.innerHTML = row[column];
      }
      
      tr.appendChild(td);
    }

    tableBody.appendChild(tr);
  }
}

// sort data by asc order or desc order
const sortData = (data) => {
  data.sort((a, b) => order === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp);
}

// compute url
const getUrl = () => {
  const start = new Date();
  const end = new Date();

  start.setMinutes(start.getMinutes() - 15);

  const startStr = start.valueOf();
  const endStr = end.valueOf();

  let ids = [];
  if (showPwrc) {
    ids.push('pwr.c');
  }
  if (showPwrv) {
    ids.push('pwr.v');
  }
  ids = ids.join(',');

  return `http://localhost:8080/history/${ids}?start=${startStr}&end=${endStr}`;
}

// fetch last 15 minutes of historical telemetry data
const fetchHistory = () => {
  fetch(getUrl())
    .then(response => response.json())
    .then(data => {
      history = data;
      renderHistoryTable();
    });
}

// insert telemetry data to table, delete old data when after reaching 1000
const updateTable = (event) => {
  const data = JSON.parse(event.data);
  
  if (order === 'desc') {
    newData.unshift(data);
    if (newData.length > max) {
      newData.pop();
    }
  } else {
    newData.push(data);
    if (newData.length > max) {
      newData.shift();
    }
  }
  renderHistoryTable();
}

openSockets = () => {
  // Subscribe to messages
  pwrcConnection.onopen = () => {
    pwrcConnection.send('subscribe pwr.c');
  }
  pwrvConnection.onopen = () => {
    pwrvConnection.send('subscribe pwr.v');
  }
  // Update table on receive message
  pwrcConnection.onmessage = updateTable;
  pwrvConnection.onmessage = updateTable;
}

fetchHistory();
openSockets();

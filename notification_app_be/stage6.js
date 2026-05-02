const axios = require("axios");
const { startMockServer } = require("./mockServer");

class PriorityMinHeap {
  constructor(maxSize) {
    this.heap = [];
    this.maxSize = maxSize;
  }

  getPriorityWeight(type) {
    const weights = { Placement: 3, Result: 2, Event: 1 };
    return weights[type] || 0;
  }

  isSmaller(a, b) {
    const weightA = this.getPriorityWeight(a.type);
    const weightB = this.getPriorityWeight(b.type);

    if (weightA !== weightB) {
      return weightA < weightB;
    }

    return new Date(a.createdAt).getTime() < new Date(b.createdAt).getTime();
  }

  push(item) {
    if (this.heap.length < this.maxSize) {
      this.heap.push(item);
      this._bubbleUp(this.heap.length - 1);
    } else {

      if (this.isSmaller(this.heap[0], item)) {

        this.heap[0] = item;
        this._bubbleDown(0);
      }
    }
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      if (this.isSmaller(this.heap[parentIdx], this.heap[index])) break;

      [this.heap[parentIdx], this.heap[index]] = [this.heap[index], this.heap[parentIdx]];
      index = parentIdx;
    }
  }

  _bubbleDown(index) {
    const length = this.heap.length;
    while (true) {
      let leftIdx = 2 * index + 1;
      let rightIdx = 2 * index + 2;
      let smallestIdx = index;

      if (leftIdx < length && this.isSmaller(this.heap[leftIdx], this.heap[smallestIdx])) {
        smallestIdx = leftIdx;
      }
      if (rightIdx < length && this.isSmaller(this.heap[rightIdx], this.heap[smallestIdx])) {
        smallestIdx = rightIdx;
      }

      if (smallestIdx === index) break;

      [this.heap[index], this.heap[smallestIdx]] = [this.heap[smallestIdx], this.heap[index]];
      index = smallestIdx;
    }
  }

  getTopItems() {
    return [...this.heap].sort((a, b) => this.isSmaller(a, b) ? 1 : -1);
  }
}

async function processPriorityStream() {
  const server = await startMockServer();
  console.log("Mock API Server running on port 8080...");

  try {
    console.log("Fetching notification stream...");
    const response = await axios.get("http://localhost:8080/api/stream/notifications");
    const notifications = response.data.data;

    console.log(`Received ${notifications.length} notifications. Processing dynamically...`);

    const top10Heap = new PriorityMinHeap(10);

    for (const notif of notifications) {
      top10Heap.push(notif);
    }

    const topNotifications = top10Heap.getTopItems();

    const outputJSON = {
      notifications: topNotifications.map((n) => {

        const dt = new Date(n.createdAt);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        const hh = String(dt.getHours()).padStart(2, '0');
        const min = String(dt.getMinutes()).padStart(2, '0');
        const ss = String(dt.getSeconds()).padStart(2, '0');

        return {
          ID: n.notificationId,
          Type: n.type,
          Message: n.title,
          Timestamp: `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
        };
      })
    };

    console.log(JSON.stringify(outputJSON, null, 2));

  } catch (error) {
    console.error("Pipeline failed:", error.message);
  } finally {
    server.close();
  }
}

processPriorityStream();

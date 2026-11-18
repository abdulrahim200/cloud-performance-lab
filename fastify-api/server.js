const Fastify = require("fastify");
const WorkerPool = require("./worker-pool");
const app = Fastify({ logger: true });
const path = require("path");
const pool = new WorkerPool(path.join(__dirname,"cpu-worker.js"),2);
pool.initialize();
app.addHook("onClose", async () => {
    await pool.close();
});
app.get('/', async (request, reply) => {
    return {
        message: "Cloud Performance Lab",
        framework: 'Fastify'
    };
});


app.get("/io", async (request, reply) => {
    const start = performance.now();
    
    await new Promise(resolve => setTimeout(resolve, 100));

    const processingTimeMs = performance.now() - start;
    return {
        type: "I/O bound",
        processingTimeMs,
        message: "Simulated asynchronous operation completed"

    };
});

app.get("/cpu", async (request, reply) => {
    const start = performance.now();
    let result = 0;
    
    for (let i = 0; i < 500000000; i++) {
        result += Math.sqrt(i);
    }
    const processingTimeMs = performance.now() - start;
    return {
        type: "CPU-bound",
        result,
        processingTimeMs
    };
});
app.get("/cpu-worker",async(request,reply)=>{
    const start = performance.now();

    const result = await new Promise((resolve,reject)=>{
        const worker = new Worker(
            path.join(__dirname,"cpu-worker.js")
        );
        worker.on("message",resolve);
        worker.on("error",reject);
        worker.on("exit",(code)=>{
            if (code !==0){
                reject(new Error(`Worker stopped with exit code ${code}`))
            }
        });
        worker.postMessage(500000000)
    });
    return {
        type:"CPU-bound using Worker Threads",
        result,
        processingTimeMs:performance.now() - start
        };
});
app.get("/cpu-pool",async(request,reply)=>{
    const start = performance.now()
    const result = await pool.execute(500000000);
    return {
        type: "CPU-bound using WorkerPool",
        result,
        processingTimeMs: performance.now() - start
    };
});
const start = async()=>{
    try 
    {
        await app.listen({
            port: 3000,
            host: '127.0.0.1'
        });
        console.log('Server running on http://127.0.0.1:3000');
    }
    catch (error) {
        app.log.error(error);
        process.exit(1);
    }
}
start();
import { trpc } from "../utils/trpc";
import swr from "../utils/swr.ts";

async function helloFunc() {
  return await swr.swrFetch("hello", async () => trpc.greeting.query());
}

const helloHandler = async () => {
    const [data, error] = await helloFunc();
    if (data?.bye) {
    document.getElementById("byebye")!.textContent = data?.bye;
    } else if (error) {
    document.getElementById("byebye")!.textContent = "Error loading greeting.";
    } 
};

helloHandler();


import { trpc } from "../utils/trpc";
import swr from "../utils/swr.ts";

const helloFunc = async (name) => {
    return await swr.swrFetch("hello", async () => trpc.greeting.query());
};

const helloHandler = async () => {
    try {
        document.getElementById("byebye").textContent = "Loading...";
        const data = await helloFunc();
        document.getElementById("byebye")!.textContent = data.bye;
    } catch (error) {
        document.getElementById("byebye")!.textContent = "Error loading greeting.";
    }
};

helloHandler();
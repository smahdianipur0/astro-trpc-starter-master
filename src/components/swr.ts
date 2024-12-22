import { trpc } from "../utils/trpc";
import useSWR from "swr";
import { createSignal, createEffect } from 'solid-js';




async function helloFunc() {
  return await useSWR("greeting", () => trpc.greeting.query())
};


// console.log(data);

createEffect(async () => {
    const { data, error } = await helloFunc();
    if (data?.bye) {
        document.getElementById("byebye")!.textContent = data.bye;
    } else if (error) {
        document.getElementById("byebye")!.textContent = "Error loading greeting.";
    } 
});
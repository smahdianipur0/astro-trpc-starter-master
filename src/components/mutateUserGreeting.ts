import { trpc } from "../utils/trpc";  
import swr from '../utils/swr.ts'; 
import { createSignal, type Accessor } from "solid-js";



const [name, setName] = createSignal("OldMate");

type nameSignal = Accessor<string>;

document.getElementById("comiunicate")!.addEventListener("input", (e) => {
    if ((e!.target as HTMLInputElement).matches("#inputNameTs")) {
        const value = (e!.target as HTMLInputElement).value;
        setName(value.toString());
    }
});

async function greetingFunc(name: string) {
    return await swr.noStaleMutate("greeting", () =>
        trpc.greetWithName.mutate({ names: name }),
    );
};

const greetingHandler = async (name: string) => {
    document.getElementById("greetingMessage")!.textContent = "Loading...";
    const [data, error] = await greetingFunc(name);
    if (data?.message) {
        document.getElementById("greetingMessage")!.textContent = data?.message;
    } else if (error) {
        document.getElementById("greetingMessage")!.textContent = "Error loading greeting";
    }
};

document.getElementById("comiunicate")!.addEventListener("click", (e) => {
    if ((e!.target as HTMLInputElement).matches("#sayname")) {
        greetingHandler(name());
    }
});
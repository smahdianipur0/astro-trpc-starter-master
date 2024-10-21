import { trpc } from "../utils/trpc";  
import cacheUtil from '../utils/swr.ts'; 
import { createSignal, Switch, Match } from "solid-js";

const [name, setName] = createSignal("OldMate");

document.getElementById("comiunicate")!.addEventListener("input", (e) => {
    if ((e!.target as HTMLInputElement).matches("#inputNameTs")) {
        const value = (e!.target as HTMLInputElement).value;
        setName(value.toString());
    }
});

const mutateUserGreeting = async (name) => {  
    const key = `greeting`; 
    const response = await cacheUtil.networkFirst(key, async () => {  
        const result = await trpc.greetWithName.mutate({  
            names: name,  
        });  
        return result;
    });  
    return response; 
};  

const greetUser = async (name) => {  
    try {  
        document.getElementById("greetingMessage").textContent = "Loading..."; 

        const response = await mutateUserGreeting(name);  
        
        document.getElementById("greetingMessage").textContent = response.message; 

    } catch (error) {  
        
        document.getElementById("greetingMessage").textContent = "Error loading greeting.";
        console.log(error)  
    }  
};  

document.getElementById("comiunicate")!.addEventListener("click", (e) => {
    if ((e!.target as HTMLInputElement).matches("#sayname")) {
      greetUser(name());
    }
});
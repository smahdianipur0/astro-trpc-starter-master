import { trpcAstroClient } from "../client"; // Ensure this path is correct  
import cacheUtil from '../components/cacheUtil.ts'; 
import { createSignal, Switch, Match } from "solid-js";

  const [name, setName] = createSignal("OldMate");

  document.getElementById("comiunicate")!.addEventListener("input", (e) => {
    if ((e!.target as HTMLInputElement).matches("#inputNameTs")) {
      const value = (e!.target as HTMLInputElement).value;
      setName(value.toString());
    }
  });

// Function to get or mutate using cacheUtil  
const mutateUserGreeting = async (name) => {  
    const key = `greeting-${name}`;  
    
    // Use cacheUtil.cacheFirst method  
    const response = await cacheUtil.cacheFirst(key, async () => {  
        // Make the API call  
        const result = await trpcAstroClient.greetWithName.mutate({  
            names: name,  
        });  
        return result; // Return the result to cache it  
    });  

    return response; // The response will either be cached or the new result  
};  

// Function to handle greet action  
const greetUser = async (name) => {  
    try {  
        document.getElementById("greetingMessage").textContent = "Loading..."; // Set loading state  

        const response = await mutateUserGreeting(name);  
        
        // Update the DOM with the response message  
        document.getElementById("greetingMessage").textContent = response.message;  
    } catch (error) {  
        console.error("Error during greeting user:", error);  
        document.getElementById("greetingMessage").textContent = "Error loading greeting.";  
    }  
};  




document.getElementById("comiunicate")!.addEventListener("click", (e) => {
    if ((e!.target as HTMLInputElement).matches("#sayname")) {
      greetUser(name());
    }
});
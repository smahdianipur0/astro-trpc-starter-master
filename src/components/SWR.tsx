import React, { useState } from "react";  
import useSWR from "swr";  
import { trpcAstroClient } from "../client";  

const GreetingComponent = () => {  
  const [name, setName] = useState("OldMate");
  const [isLoading, setIsLoading] = useState(false); 

  const { data, error, mutate } = useSWR('hello', () =>   
    trpcAstroClient.greetWithName.mutate({ names: name }),
  );  

  const handleSubmit = async () => {
  setIsLoading(true);  
    try {  
      await mutate();  
      setName("");
    } catch (err) {  
      console.error("Error during mutation:", err);  
    } finally {
       setIsLoading(false);
    } 
  }  

  if (error) return <div>Error loading greeting.</div>;  
  if (!data) return <div>Loading...</div>;  

  return (  
    <div>  
      <input  
        type="text"  
        value={name}  
        onChange={(e) => setName(e.target.value)}  
        placeholder="Enter your name"  
      />  
      <button onClick={handleSubmit} disabled={isLoading || name === ""}>
        {isLoading ? "Greeting..." : "Greet Me!"}  </button>
      <div>{isLoading ? "Greeting..." : data.message}</div>
    </div>  
  );  
}  

export default GreetingComponent;
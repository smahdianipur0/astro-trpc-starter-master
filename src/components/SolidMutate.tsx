import { ErrorBoundary, Suspense, createEffect } from "solid-js";  
import {  createMutation,  QueryClient, QueryClientProvider, } from "@tanstack/solid-query";  
import { trpcAstroClient } from "../client";  
import { createSignal } from "solid-js";  
import { createRenderEffect } from "solid-js";
import { Switch, Match, For } from 'solid-js'  

function Example() {  
  const [name, setName] = createSignal("OldMate");  

  const mutation = createMutation(() => ({  
    mutationKey: ["TanStack Query"],  
    mutationFn: async (newData) => {  
      const response = await trpcAstroClient.greetWithName.mutate({  
        names: newData, // Ensure this is what the backend expects  
      });  
      return response;  
    },  
  }));  

  function model(el, accessor) {  
    const [s, set] = accessor();  
    el.addEventListener("input", (e) => set(e.currentTarget.value));  
    createRenderEffect(() => el.value = s());   
  }  

  return (  
    <div>  
      <input use:model={[name, setName]} />  
      <button type="button"   
        onClick={(e) => mutation.mutate(name())} // <- Access the value here  
      >  
        Greet  
      </button>  
      <Switch>
        <Match when={mutation.isPending}>
          <div>Loading...</div>
        </Match>
        <Match when={mutation.isError}>
          <div>Error: {mutation.error.message}</div>
        </Match>
        <Match when={mutation.isSuccess}>
          <div>{mutation.data?.message}</div>
        </Match>
      </Switch>

    </div>  
  );  
}  

const client = new QueryClient();  

function App() {  
  return (  
    <QueryClientProvider client={client}>  
      <Example />  
    </QueryClientProvider>  
  );  
}  

export default App;
import {  createQuery,  QueryClient, QueryClientProvider} from '@tanstack/solid-query';  
import { trpcAstroClient } from "../client"; 
import { Switch, Match } from 'solid-js'

function Example() {  
  const helloQuery = createQuery(() => ({  
    queryKey: ['TanStack Query'],  
    queryFn: async () => {  
      const result = await trpcAstroClient.greeting.query();    
      return result;  
    },  
  }));  

  return (  
    <div>  
      <Switch>
        <Match when={helloQuery.isPending}>
          <div>Loading...</div>
        </Match>
        <Match when={helloQuery.isError}>
          <div>Error: {helloQuery.error.message}</div>
        </Match>
        <Match when={helloQuery.isSuccess}>
          <div>{helloQuery.data?.bye}</div>
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
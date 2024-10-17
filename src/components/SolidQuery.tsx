import { ErrorBoundary, Suspense, createEffect } from 'solid-js';  
import {  createQuery,  QueryClient, QueryClientProvider} from '@tanstack/solid-query';  
import { trpcAstroClient } from "../client";  

function Example() {  
  const repositoryQuery = createQuery(() => ({  
    queryKey: ['TanStack Query'],  
    queryFn: async () => {  
      const result = await trpcAstroClient.greeting.query();    
      return result;  
    },  
  }));  

  return (  
    <div>  
      <div>Static Content</div>  
      <ErrorBoundary fallback={(error) => <div>Something went wrong</div>}>  
        <Suspense fallback={<div>Loading...</div>}>  
          <div>{repositoryQuery.data?.bye ?? 'No data available'}</div>  
        </Suspense>  
      </ErrorBoundary>  
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
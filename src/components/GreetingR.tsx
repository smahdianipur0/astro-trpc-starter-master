import useSWR from 'swr';  
import { trpcAstroClient } from '../client'; 


const fetchGreeting = () => {  
  return trpcAstroClient.greeting.query();  
};  

const GreetingComponent = () => {  

  const { data, error } = useSWR('greeting', fetchGreeting);   
  if (error) return <div>Error loading greeting.</div>;  
  if (!data) return <div>Loading...</div>;  

  return (  
    <div>  
      SWR says: {data.bye} {}  
    </div>  
  );  
};  

export default GreetingComponent;  
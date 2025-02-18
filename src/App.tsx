import "./App.css";
import HierarchyWidget from "./components/hierarhy-widget";
import Loading from "./components/loading";
import ViewerComponent from "./components/viewer-component";

function App() {
  return (
    <>
      <ViewerComponent>
        <Loading />
        {/* 
          TODO Создай здесь виджет
          виджет должен отображать иерархию THREE.Object3D в переменной viewer.model 
          клик по объекту иерархии должен хайлатить объект во вьювере
          */}
        {/* Ok daddy */}
        <HierarchyWidget />
      </ViewerComponent>
    </>
  );
}

export default App;

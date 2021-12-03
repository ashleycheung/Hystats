import { useEffect, useRef, useState } from 'react';
import { RotatingAnimation, createOrbitControls, SkinViewer } from 'skinview3d';
import styles from './App.module.css';
import minecraftImg from './assets/logo.svg';
import { Chart, DoughnutController, ArcElement, Legend, Title } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Legend, Title);

const ENDPOINT = 'http://localhost:8004';

const CHARTCOLORS = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
]

function App() {
  const [ username, setUsername ] = useState('');
  const [ userData, setUserData ] = useState();
  const [ isLoading, setIsLoading ] = useState(false);
  const [ chart, setChart ] = useState();
  const resultsRef = useRef();
  const chartRef = useRef();
  const onClick = async () => {
    setIsLoading(true);
    const r = await fetch(`${ENDPOINT}/user?username=${username}`);
    setIsLoading(false);
    if (r.status !== 200) {
      return;
    }
    const rJson = await r.json();
    setUserData(rJson);
    console.log(rJson);
  }
  const makeData = (games) => {
    console.log(games);
    const dataMap = {}
    for (const g of games) {
      if (g.gameType in dataMap) {
        dataMap[g.gameType] += 1;
      } else {
        dataMap[g.gameType] = 1;
      }
    }
    const labels = [];
    const data = [];
    const bgColors = [];
    let i = 0;
    for (const gType of Object.keys(dataMap)) {
      labels.push(gType);
      data.push(dataMap[gType]);
      bgColors.push(CHARTCOLORS[i % CHARTCOLORS.length]);
      i++;
    }
    const out = {
      labels: labels,
      datasets: [{
        label: 'Game History',
        data: data,
        backgroundColor: bgColors,
      }]
    }
    return out;
  }
  useEffect(() => {
    if (resultsRef.current !== undefined) {
      if (userData) {
        resultsRef.current.style.display = "flex";
        // Set skin
        let skinViewer = new SkinViewer({
          canvas: document.getElementById("skin-container"),
          width: 300,
          height: 400,
          skin: `data:image/png;base64,${userData.skin}`
        });
        let control = createOrbitControls(skinViewer);
        control.enableZoom = false;
        control.enablePan = false;
        skinViewer.animations.add(RotatingAnimation);
        control.enableRotate = true;
        // Render chart
        if (chart) {
          chart.destroy();
        }
        setChart(new Chart(chartRef.current, {
          type: 'doughnut',
          data: makeData(userData.games),
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: true,
                position: 'top',
              },
              title: {
                display: true,
                text: 'Game History'
              }
            }
          }
        }));
      } else {
        resultsRef.current.style.display = "none";
      }
    }
  }, [userData])
  const renderLoading = () => {
    if (isLoading) {
      return(
      <div className={styles.loaderWrapper}>
        <div className="loader-5 center"><span></span></div>
      </div>)
    }
    return null;
  }
  const renderName = () => {
    if (userData) {
      return userData.username
    }
    return ''
  }
  return (
    <div className={styles.app}>
      <div className={styles.searchWrapper}>
        <div className={styles.logo}>
          <img className={styles.logoImg} src={minecraftImg} alt='logo'/>
          <div>
            <div className={styles.logoText}>Hystats</div>
            <div className={styles.slogan}>Real time stats and data for HyPixel</div>
          </div>
        </div>
        <input placeholder='Minecraft Username' className={styles.searchInput} spellCheck={false} onChange={e => setUsername(e.target.value)} value={username}/>
        <button className={styles.searchBtn} onClick={onClick}>Search</button>
      </div>
      {renderLoading()}
      <div className={styles.resultsWrapper} style={{display: 'none'}} ref={resultsRef} >
        <div className={styles.resultsProfile}>
          <div className={styles.resultsUsername}>{renderName()}</div>
          <canvas id='skin-container' className={styles.skinContainer}/>
        </div>
        <div className={styles.chartWrapper}>
          <canvas ref={chartRef}/>
        </div>
      </div>
    </div>
  );
}

export default App;

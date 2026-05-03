import React, { useRef, useEffect } from 'react';
// FIX: Using default export to prevent the Vite syntax error
import ForceGraph2D from 'react-force-graph-2d';

// Match the node colors to the factions defined in your App.jsx
const getFactionColor = (faction) => {
  if (faction === 'Western') return '#00d4ff';      // Bright Blue
  if (faction === 'Eastern') return '#ff003c';      // Neon Red/Pink
  if (faction === 'Middle East') return '#00ff9d';  // Spring Green
  return '#b026ff';                                 // Neon Purple
};

const SocialGraph = ({ graphData }) => {
  const fgRef = useRef();

  // Auto-zoom to fit the graph when data loads or updates
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Small delay to ensure the physics engine has settled slightly before zooming
      setTimeout(() => {
        fgRef.current.zoomToFit(400, 50);
      }, 500);
    }
  }, [graphData]);

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      
      // -- EDGE/LINK STYLING --
      // Color edges Green (Safe) or Red (Bad) based on the Neo4j status
      linkColor={(link) => link.status === 'safe' ? '#00ff9d' : '#ff003c'}
      linkWidth={2}
      
      // Add animated particles traveling along the links for a cyber-warfare feel
      linkDirectionalParticles={3}
      linkDirectionalParticleWidth={2}
      linkDirectionalParticleSpeed={0.005}
      linkDirectionalParticleColor={(link) => link.status === 'safe' ? '#00ff9d' : '#ff003c'}
      
      backgroundColor="transparent"
      
      // -- CUSTOM NODE STYLING --
      // We use a custom canvas object to draw glowing neon nodes and text labels
      nodeCanvasObject={(node, ctx, globalScale) => {
        const label = node.name;
        const fontSize = 12 / globalScale;
        ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        const color = getFactionColor(node.faction);

        // 1. Draw Outer Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        // 2. Draw Core Node
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
        ctx.fill();

        // 3. Draw White Center (makes it look like an intense LED)
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, 2 * Math.PI, false);
        ctx.fill();

        // 4. Draw Label underneath the node
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = color; 
        ctx.fillText(label.toUpperCase(), node.x, node.y + 8);
      }}
      
      // Interaction settings
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      cooldownTicks={100}
    />
  );
};

export default SocialGraph;
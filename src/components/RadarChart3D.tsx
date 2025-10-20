import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface RadarChartProps {
  data: {
    category: string;
    value: number;
    fullMark: number;
  }[];
  width?: number;
  height?: number;
  colors?: string[];
  title?: string;
}

const RadarChart3D: React.FC<RadarChartProps> = ({
  data,
  width = 500,
  height = 500,
  colors = ['#3b82f6', '#8b5cf6', '#06b6d4'],
  title = 'Análise de Desempenho'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const radius = Math.min(innerWidth, innerHeight) / 2;
    const centerX = innerWidth / 2 + margin.left;
    const centerY = innerHeight / 2 + margin.top;

    // Create a group for the radar chart
    const g = svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1f2937')
      .text(title);

    // Calculate angles for each axis
    const angleSlice = (Math.PI * 2) / data.length;

    // Scale for the radius
    const rScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.fullMark) || 100])
      .range([0, radius]);

    // Draw the circular grid lines
    const axisGrid = g.append('g').attr('class', 'axis-grid');

    // Draw the background circles with 3D effect
    const levels = 5;
    const levelFactor = radius / levels;

    for (let level = 0; level < levels; level++) {
      const r = levelFactor * (level + 1);
      
      // Main circle
      axisGrid.append('circle')
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1);
      
      // 3D effect - shadow gradient
      const gradientId = `circleGradient-${level}`;
      
      const gradient = svg.append('defs')
        .append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#f8fafc')
        .attr('stop-opacity', 0.8);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#e2e8f0')
        .attr('stop-opacity', 0.3);
      
      // Background circle with gradient
      axisGrid.append('circle')
        .attr('r', r)
        .attr('fill', `url(#${gradientId})`)
        .attr('stroke', 'none');
    }

    // Draw the axes
    const axis = g.append('g').attr('class', 'axis');

    // Create the straight lines radiating outward from the center
    const axes = axis.selectAll('.axis')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'axis');

    // Draw the axis lines with 3D effect
    axes.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (d, i) => rScale(d.fullMark) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (d, i) => rScale(d.fullMark) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    // Add axis labels with 3D effect
    axes.append('text')
      .attr('class', 'legend')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('x', (d, i) => (radius + 20) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (d, i) => (radius + 20) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d.category)
      .attr('font-size', '12px')
      .attr('fill', '#4b5563')
      .attr('font-weight', 'bold')
      .style('text-shadow', '1px 1px 2px rgba(255, 255, 255, 0.8)');

    // Create the radar chart blobs
    // Map the data to coordinates
    const radarLine = d3.lineRadial<typeof data[0]>()
      .radius(d => rScale(d.value))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // Create a wrapper for the blobs
    const blobWrapper = g.append('g').attr('class', 'blobs');

    // Create the 3D effect gradient
    const gradientId = 'radarGradient';
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', colors[0])
      .attr('stop-opacity', 0.8);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', colors[1])
      .attr('stop-opacity', 0.6);

    // Append the blob
    blobWrapper.append('path')
      .datum(data)
      .attr('d', radarLine as any)
      .attr('fill', `url(#${gradientId})`)
      .attr('stroke', colors[2])
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))');

    // Add circles at each data point for 3D effect
    blobWrapper.selectAll('.radar-circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'radar-circle')
      .attr('r', 6)
      .attr('cx', (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('fill', '#fff')
      .attr('stroke', colors[2])
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))');

    // Add value labels
    blobWrapper.selectAll('.radar-value')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'radar-value')
      .attr('x', (d, i) => (rScale(d.value) + 15) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (d, i) => (rScale(d.value) + 15) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1f2937')
      .text(d => `${d.value}%`)
      .style('text-shadow', '1px 1px 2px rgba(255, 255, 255, 0.8)');

    // Add animation
    svg.selectAll('path')
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .style('opacity', 1);

    svg.selectAll('circle.radar-circle')
      .attr('r', 0)
      .transition()
      .duration(1000)
      .attr('r', 6);

  }, [data, width, height, colors, title]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible"
      />
    </div>
  );
};

export default RadarChart3D;
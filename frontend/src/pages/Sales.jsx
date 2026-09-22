import DaySalesGraph from '../components/DaySalesGraph';
import MonthSalesGraph from '../components/MonthSalesGraph';

export default function Sales() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
      gap: 20
    }}>
      <DaySalesGraph />
      <MonthSalesGraph />
    </div>
  );
}

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function CaseDetailsPage() {
    const { id } = useParams();

    const { data } = useQuery({
        queryKey: ['case', id],
        queryFn: async () => {
            const response = await api.get(`/cases/${id}`);
            return response.data.case;
        },
    });

    if (!data) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Case Details</h1>

            <div className="card">
                <h3>{data.caseNumber}</h3>
                <p>{data.customerName}</p>
                <p>Amount: ${data.amount}</p>
                <p>Status: {data.status}</p>
            </div>
        </div>
    );
}

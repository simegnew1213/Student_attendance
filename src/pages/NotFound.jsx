import { Link } from 'react-router-dom'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export default function NotFound() {
  return (
    <Card>
      <CardHeader title="Page not found" description="The page you requested does not exist." />
      <Link to="/">
        <Button>Go to Dashboard</Button>
      </Link>
    </Card>
  )
}

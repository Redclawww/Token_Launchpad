import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TokenLaunchpadProps {
  image: string
  name: string
  description: string
  symbol: string
  supply: number
}

export function TokenLaunchpad({ image, name, description, symbol, supply }: TokenLaunchpadProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Image
            src={image}
            alt={`${name} token`}
            width={64}
            height={64}
            className="rounded-full"
          />
          <div>
            <CardTitle className="text-2xl font-bold">{name}</CardTitle>
            <Badge variant="secondary" className="mt-1">
              {symbol}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
          <span className="font-semibold">Total Supply:</span>
          <span className="text-lg">{supply.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}


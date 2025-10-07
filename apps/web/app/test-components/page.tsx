import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageContainer } from '@/components/common/page-container';
import { SectionHeader } from '@/components/common/section-header';
import { ButtonGroup } from '@/components/common/button-group';
import { StatCard } from '@/components/common/stat-card';

export default function TestComponentsPage() {
  return (
    <PageContainer>
      <SectionHeader
        title="Component Library Showcase"
        description="Reusable components built on shadcn/ui with consistent theming"
        level={1}
      />

      <section className="space-y-4">
        <SectionHeader title="UI Primitives" level={2} />

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Buttons</h3>
            <ButtonGroup>
              <Button>Default Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </ButtonGroup>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Button Sizes</h3>
            <ButtonGroup align="center">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </ButtonGroup>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Cards"
          description="Versatile card components for content display"
          level={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Developer Platform</CardTitle>
              <CardDescription>
                Build on Solana with our powerful tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This is a standard card component from shadcn/ui. It includes a
                header, content, and footer sections with consistent theming.
              </p>
            </CardContent>
            <CardFooter>
              <ButtonGroup align="between" className="w-full">
                <Button variant="outline">Cancel</Button>
                <Button>Get Started</Button>
              </ButtonGroup>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsive Design</CardTitle>
              <CardDescription>Cards adapt to any screen size</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Using our component system, you can build responsive layouts
                that work seamlessly across all devices.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Stat Cards"
          description="Display metrics and statistics with style"
          level={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value="12,543"
            description="Active users this month"
            trend={{ value: 12.5, direction: 'up' }}
          />
          <StatCard
            title="Revenue"
            value="$54,231"
            description="Monthly recurring revenue"
            trend={{ value: 8.3, direction: 'up' }}
          />
          <StatCard
            title="Conversion Rate"
            value="3.24%"
            description="Down from last week"
            trend={{ value: 2.1, direction: 'down' }}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Layout Components"
          description="Consistent spacing and containment utilities"
          level={2}
        />

        <Card>
          <CardHeader>
            <CardTitle>PageContainer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Variants:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>default - Standard container padding</li>
                <li>tight - Reduced padding</li>
                <li>wide - Increased padding</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Spacing:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>default - Standard vertical spacing</li>
                <li>tight - Reduced vertical spacing</li>
                <li>loose - Increased vertical spacing</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ButtonGroup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Vertical Layout:</p>
              <ButtonGroup orientation="vertical">
                <Button variant="outline" className="w-full">
                  First Option
                </Button>
                <Button variant="outline" className="w-full">
                  Second Option
                </Button>
                <Button variant="outline" className="w-full">
                  Third Option
                </Button>
              </ButtonGroup>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Aligned End:</p>
              <ButtonGroup align="end">
                <Button variant="ghost">Cancel</Button>
                <Button>Save Changes</Button>
              </ButtonGroup>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageContainer>
  );
}

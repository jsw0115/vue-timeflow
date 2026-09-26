# Database migrations

Flyway executes `V{number}__{description}.sql` files once, in version order. Do not edit an applied migration; use the next version and `ALTER TABLE` instead. `V1__initial_schema.sql` creates the nine tables mapped by current JPA entities.
